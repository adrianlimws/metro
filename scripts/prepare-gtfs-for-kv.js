#!/usr/bin/env node

/**
 * Prepare GTFS data for manual KV upload
 * This script extracts GTFS data and formats it for Cloudflare KV storage
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { ZipExtractor } from '../src/utils/zip-extractor.js'
import { parseGTFSFile } from '../src/utils/csv-parser.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const GTFS_ZIP_PATH = path.join(__dirname, '..', 'data', 'gtfs', 'gtfs.zip')
const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'gtfs', 'kv-ready')

async function prepareGTFSForKV() {
  console.log('🚀 Preparing GTFS data for manual KV upload...')
  console.log(`📁 ZIP file: ${GTFS_ZIP_PATH}`)
  console.log(`📁 Output: ${OUTPUT_DIR}`)
  
  try {
    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true })
    }
    
    // Check if ZIP file exists
    if (!fs.existsSync(GTFS_ZIP_PATH)) {
      throw new Error('GTFS ZIP file not found! Run npm run fetch-gtfs first.')
    }
    
    const zipStats = fs.statSync(GTFS_ZIP_PATH)
    console.log(`📏 ZIP file size: ${Math.round(zipStats.size / 1024 / 1024 * 100) / 100} MB`)
    
    // Read and extract ZIP file using JSZip (the working method)
    const zipData = fs.readFileSync(GTFS_ZIP_PATH)
    console.log('📖 Read ZIP file into memory')
    
    // Use JSZip for real extraction
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    const zipContents = await zip.loadAsync(zipData)
    
    const extractedFiles = {}
    
    // Extract all .txt files (GTFS standard files)
    for (const [filename, file] of Object.entries(zipContents.files)) {
      if (filename.endsWith('.txt') && !file.dir) {
        console.log(`📄 Extracting ${filename}...`)
        
        // Get file content as ArrayBuffer
        const content = await file.async('arraybuffer')
        extractedFiles[filename] = new Uint8Array(content)
        
        console.log(`   ✅ ${filename}: ${content.byteLength} bytes`)
      }
    }
    
    console.log(`\n🔓 Extracted ${Object.keys(extractedFiles).length} GTFS files`)
    
    // Process each file
    const results = {}
    const uploadCommands = []
    
    for (const [filename, fileData] of Object.entries(extractedFiles)) {
      if (filename.endsWith('.txt')) {
        console.log(`\n📄 Processing ${filename}...`)
        
        const textContent = new TextDecoder().decode(fileData)
        const parsedData = parseGTFSFile(filename, textContent)
        
        if (parsedData && parsedData.length > 0) {
          const baseKey = `gtfs:${filename.replace('.txt', '')}`
          const dataSize = new TextEncoder().encode(JSON.stringify(parsedData)).length
          const maxSize = 25 * 1024 * 1024 // 25MB KV limit
          
          if (dataSize > maxSize) {
            console.log(`   📦 Large file detected (${Math.round(dataSize / 1024 / 1024)}MB), splitting into chunks...`)
            
            // Split into chunks
            const chunkSize = 10000 // 10k records per chunk
            const chunks = []
            
            for (let i = 0; i < parsedData.length; i += chunkSize) {
              chunks.push(parsedData.slice(i, i + chunkSize))
            }
            
            console.log(`   📦 Split into ${chunks.length} chunks`)
            
            // Save each chunk
            for (let i = 0; i < chunks.length; i++) {
              const chunkFile = path.join(OUTPUT_DIR, `${filename.replace('.txt', '')}_chunk_${i}.json`)
              fs.writeFileSync(chunkFile, JSON.stringify(chunks[i], null, 2))
              
              const chunkKey = `${baseKey}:chunk:${i}`
              const uploadCmd = `wrangler kv key put "${chunkKey}" --path "${chunkFile}" --namespace-id a5203d8b97c8449b8ac7559ef8753810 --remote`
              uploadCommands.push(uploadCmd)
            }
            
            // Save metadata
            const metadataFile = path.join(OUTPUT_DIR, `${filename.replace('.txt', '')}_metadata.json`)
            const metadata = {
              totalRecords: parsedData.length,
              chunkCount: chunks.length,
              chunkSize: chunkSize
            }
            fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2))
            
            const metadataKey = `${baseKey}:metadata`
            const metadataCmd = `wrangler kv key put "${metadataKey}" --path "${metadataFile}" --namespace-id a5203d8b97c8449b8ac7559ef8753810 --remote`
            uploadCommands.push(metadataCmd)
            
            results[filename] = {
              key: baseKey,
              records: parsedData.length,
              chunks: chunks.length,
              size: fileData.length,
              chunked: true
            }
            
            console.log(`   ✅ ${parsedData.length} records → ${chunks.length} chunks`)
          } else {
            // Normal file - save as single file
            const outputFile = path.join(OUTPUT_DIR, `${filename.replace('.txt', '')}.json`)
            fs.writeFileSync(outputFile, JSON.stringify(parsedData, null, 2))
            
            results[filename] = {
              key: baseKey,
              records: parsedData.length,
              size: fileData.length,
              outputFile: path.relative(process.cwd(), outputFile),
              chunked: false
            }
            
            // Generate upload command
            const uploadCmd = `wrangler kv key put "${baseKey}" --path "${outputFile}" --namespace-id a5203d8b97c8449b8ac7559ef8753810 --remote`
            uploadCommands.push(uploadCmd)
            
            console.log(`   ✅ ${parsedData.length} records → ${outputFile}`)
          }
        } else {
          console.log(`   ⚠️  No data found in ${filename}`)
        }
      }
    }
    
    // Save upload commands to file
    const commandsFile = path.join(OUTPUT_DIR, 'upload-commands.txt')
    fs.writeFileSync(commandsFile, uploadCommands.join('\n'))
    
    // Save summary
    const summaryFile = path.join(OUTPUT_DIR, 'summary.json')
    fs.writeFileSync(summaryFile, JSON.stringify(results, null, 2))
    
    console.log('\n📊 Summary:')
    console.log('─'.repeat(60))
    
    let totalRecords = 0
    for (const [filename, data] of Object.entries(results)) {
      console.log(`📄 ${filename.padEnd(20)} ${data.records.toString().padStart(8)} records ${data.key}`)
      totalRecords += data.records
    }
    
    console.log(`\n📈 Total: ${totalRecords} records across ${Object.keys(results).length} files`)
    console.log(`\n📁 Files saved to: ${OUTPUT_DIR}`)
    console.log(`📋 Upload commands: ${commandsFile}`)
    console.log(`📊 Summary: ${summaryFile}`)
    
    console.log('\n🚀 Next Steps:')
    console.log('1. Review the generated JSON files')
    console.log('2. Run the upload commands to upload to KV storage')
    console.log('3. Test the API endpoints')
    
    console.log('\n✅ GTFS data preparation completed successfully!')
    
  } catch (error) {
    console.error('❌ Error preparing GTFS data:', error.message)
    console.error('Stack trace:', error.stack)
    process.exit(1)
  }
}

// Run the preparation
prepareGTFSForKV().catch(console.error)
