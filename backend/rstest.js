const { getToken } = require('./resources/scripts/getToken');
const serial = require('./resources/scripts/rs');
const grpc = require('@grpc/grpc-js');

async function testRS() {
  try {
    const token = await getToken();
    const metadata = new grpc.Metadata();
    metadata.add('authorization', `Bearer ${token}`);

    console.log('\n=== [1] Initial Status Check ===');
    /* This block of code is performing the following actions: */
    let status = await serial.checkStatus(metadata);
    let mode = await serial.getMode(metadata)
    console.log('Initial status:', status);
    console.log('Initial mode:', mode === 0 ? 'RS485' : 'RS422');

    console.log('\n=== [2] Switching to RS422 ===');
    await serial.setMode("RS422", metadata);
    status = await serial.checkStatus(metadata);
    mode = await serial.getMode(metadata);
    console.log('After setting RS422:', status);
    console.log('Current mode:', mode );

    console.log('\n=== [3] Switching to RS485 ===');
    await serial.setMode("RS485", metadata);
    status = await serial.checkStatus(metadata);
    mode = await serial.getMode(metadata);
    console.log('After setting RS485:', status);
    console.log('Current mode:', mode );


    console.log('\n✅ Serial interface test completed.\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testRS();
