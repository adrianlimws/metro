#!/usr/bin/env node

/**
 * Clean GTFS data from Cloudflare KV storage
 * This script removes all existing GTFS data from KV storage
 */

import { execSync } from 'child_process'

const NAMESPACE_ID = 'a5203d8b97c8449b8ac7559ef8753810'

// All GTFS keys to delete
const keysToDelete = [
  'gtfs:agency',
  'gtfs:calendar', 
  'gtfs:routes',
  'gtfs:shapes',
  'gtfs:stops',
  'gtfs:trips',
  'gtfs:stop_times',
  'gtfs:stop_times:metadata'
]

// Add stop_times chunks
for (let i = 0; i <= 31; i++) {
  keysToDelete.push(`gtfs:stop_times:chunk:${i}`)
}

async function cleanKVStorage() {
  console.log('🧹 Cleaning GTFS data from KV storage...')
  console.log(`📋 Found ${keysToDelete.length} keys to delete`)
  
  let successCount = 0
  let errorCount = 0
  
  for (let i = 0; i < keysToDelete.length; i++) {
    const key = keysToDelete[i]
    console.log(`\n🗑️  Deleting ${i + 1}/${keysToDelete.length}: ${key}`)
    
    try {
      execSync(`wrangler kv key delete "${key}" --namespace-id ${NAMESPACE_ID} --remote`, { 
        stdio: 'pipe',
        cwd: process.cwd()
      })
      
      console.log(`   ✅ Successfully deleted ${key}`)
      successCount++
      
    } catch (error) {
      console.error(`   ❌ Failed to delete ${key}:`, error.message)
      errorCount++
    }
  }
  
  console.log('\n📊 Cleanup Summary:')
  console.log('─'.repeat(40))
  console.log(`✅ Successful: ${successCount}`)
  console.log(`❌ Failed: ${errorCount}`)
  console.log(`📈 Total: ${successCount + errorCount}`)
  
  if (errorCount === 0) {
    console.log('\n🎉 KV storage cleaned successfully!')
    console.log('\n📤 Ready to upload fresh data with:')
    console.log('npm run upload-gtfs')
  } else {
    console.log('\n⚠️  Some deletions failed. Check the errors above.')
  }
}

// Run the cleanup
cleanKVStorage().catch(console.error)
