#!/usr/bin/env node

/**
 * Upload prepared GTFS data to Cloudflare KV
 * This script uploads the pre-processed GTFS data to KV storage
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.join(__dirname, '..', 'data', 'gtfs', 'kv-ready')
const COMMANDS_FILE = path.join(DATA_DIR, 'upload-commands-remote.txt')

async function uploadGTFSToKV() {
  console.log('🚀 Uploading GTFS data to Cloudflare KV...')
  console.log(`📁 Data directory: ${DATA_DIR}`)
  
  try {
    // Check if commands file exists
    if (!fs.existsSync(COMMANDS_FILE)) {
      throw new Error('Upload commands file not found! Run npm run prepare-gtfs first.')
    }
    
    // Read upload commands
    const commands = fs.readFileSync(COMMANDS_FILE, 'utf8').split('\n').filter(cmd => cmd.trim())
    
    console.log(`📋 Found ${commands.length} upload commands`)
    
    // Upload each file
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      const key = command.match(/--path "([^"]+)"/)?.[1]
      const kvKey = command.match(/wrangler kv:key put "([^"]+)"/)?.[1]
      
      console.log(`\n📤 Uploading ${i + 1}/${commands.length}: ${kvKey}`)
      
      try {
        // Execute the wrangler command
        execSync(command, { 
          stdio: 'pipe',
          cwd: path.join(__dirname, '..')
        })
        
        console.log(`   ✅ Successfully uploaded ${kvKey}`)
        successCount++
        
      } catch (error) {
        console.error(`   ❌ Failed to upload ${kvKey}:`, error.message)
        errorCount++
      }
    }
    
    console.log('\n📊 Upload Summary:')
    console.log('─'.repeat(40))
    console.log(`✅ Successful: ${successCount}`)
    console.log(`❌ Failed: ${errorCount}`)
    console.log(`📈 Total: ${successCount + errorCount}`)
    
    if (errorCount === 0) {
      console.log('\n🎉 All GTFS data uploaded successfully!')
      console.log('\n🧪 Test the API:')
      console.log('curl https://metro-gtfs-api-simple.adrianlimws.workers.dev/api/gtfs/routes')
      console.log('curl https://metro-gtfs-api-simple.adrianlimws.workers.dev/api/gtfs/stops')
    } else {
      console.log('\n⚠️  Some uploads failed. Check the errors above.')
    }
    
  } catch (error) {
    console.error('❌ Error uploading GTFS data:', error.message)
    process.exit(1)
  }
}

// Run the upload
uploadGTFSToKV().catch(console.error)
