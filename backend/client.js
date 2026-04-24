const { getToken } = require('./resources/scripts/getToken');
const grpc = require('@grpc/grpc-js');
const CanClient = require('./resources/scripts/can'); // zakładam, że can.js tu się znajduje

async function main() {
  try {
    // Pobierz token i ustaw metadane
    const token = await getToken();
    const metadata = new grpc.Metadata();
    metadata.add('Authorization', `Bearer ${token}`);

    const can = CanClient; // Korzystamy bezpośrednio, bo eksportuje funkcje
    const interfaceName = 'CAN1';

    // Konfiguracja interfejsu CAN
    console.log('Konfiguracja interfejsu CAN...');
    await can.setTransceiverPower(interfaceName, true, metadata);
    await can.setTermination(interfaceName, true, metadata);
    await can.setInterfaceToContainer(interfaceName, '', metadata); // Mapowanie do hosta

    // Weryfikacja
    const powerStatus = await can.getTransceiverPower(interfaceName, metadata);
    const terminationStatus = await can.getTermination(interfaceName, metadata);
    console.log(`Status: Power=${powerStatus}, Termination=${terminationStatus}`);

    // Nasłuchiwanie ramek
    console.log('\nRozpoczynanie nasłuchiwania ramek CAN...');

    const client = require('./resources/scripts/can')(); // jeśli trzeba zachować `call`
    const call = client.Receive({ interfaceName }, metadata);

    call.on('data', (frame) => {
      console.log(`[${new Date(frame.timestamp.seconds * 1000).toISOString()}] Odebrano: ID=${frame.id.toString(16)}, Data=${Buffer.from(frame.data).toString('hex')}`);
    });

    call.on('error', (err) => {
      console.error('Błąd odbioru:', err);
    });

    call.on('end', () => {
      console.log('Zakończono odbiór ramek.');
    });

    // Wysyłanie testowych ramek co 2 sekundy
    setInterval(async () => {
      const testFrame = {
        id: 0x123,
        data: Buffer.from([0x01, 0x02, 0x03, 0x04]),
        isExtended: false
      };

      try {
        const sendClient = require('./resources/scripts/can_client_instance')(); // klient do wysyłania
        await new Promise((resolve, reject) => {
          sendClient.Send({ interfaceName, frame: testFrame }, metadata, (err, _) => {
            if (err) return reject(err);
            resolve();
          });
        });

        console.log(`Wysłano ramkę: ID=${testFrame.id.toString(16)}`);
      } catch (err) {
        console.error('Błąd wysyłania:', err);
      }
    }, 2000);

    // Zatrzymanie po 30 sekundach
    setTimeout(() => {
      call.cancel();
      console.log('Zatrzymano nasłuchiwanie.');
      process.exit(0);
    }, 30000);

  } catch (error) {
    console.error('Błąd:', error);
    process.exit(1);
  }
}

main();
