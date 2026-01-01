// Quick test to check the schema debug endpoint
const testSchemaDebug = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/admin/schema-debug')
    const data = await response.json()
    console.log('Schema Debug Response:')
    console.log(JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error:', error.message)
  }
}

testSchemaDebug()
