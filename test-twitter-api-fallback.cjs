const https = require('https')

// Test Twitter API fallback
async function testTwitterAPIFallback() {
  console.log('🧪 ТЕСТИРОВАНИЕ TWITTER API FALLBACK')
  console.log('='.repeat(60))
  
  const handles = ['zeroxcholy', '0xwenmoon', '0xmert_']
  
  for (const handle of handles) {
    console.log(`\n🔍 Тестирую @${handle}...`)
    
    try {
      // Test Netlify function
      const response = await fetch(`https://rad-toffee-97e32a.netlify.app/.netlify/functions/rep?u=${handle}`)
      const data = await response.json()
      
      console.log(`✅ Статус: ${response.status}`)
      console.log(`📊 Репутация: ${data.rep}`)
      console.log(`👥 Подписчики: ${data.followers?.toLocaleString()}`)
      console.log(`🔍 Источник данных: ${data.source || 'tweetscout'}`)
      
      if (data.source === 'twitter') {
        console.log(`⚠️  Использован Twitter API fallback`)
      } else {
        console.log(`✅ Использован TweetScout`)
      }
      
    } catch (error) {
      console.error(`❌ Ошибка для @${handle}:`, error.message)
    }
  }
}

// Simple fetch implementation
function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data)
          resolve({
            status: res.statusCode,
            json: () => Promise.resolve(jsonData)
          })
        } catch (error) {
          reject(new Error(`Invalid JSON: ${data}`))
        }
      })
    })
    
    req.on('error', (error) => {
      reject(error)
    })
    
    req.end()
  })
}

// Run test
testTwitterAPIFallback() 