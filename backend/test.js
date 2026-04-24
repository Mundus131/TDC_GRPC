const readline = require('readline');


// Obsługa wejścia z klawiatury
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

console.log('Wpisuj znaki, wyślemy je przez port szeregowy. Wciśnij Ctrl+C, by zakończyć.');

process.stdin.on('keypress', (str, key) => {
  if (key.sequence === '\u0003') {
    // Ctrl+C
    process.exit();
  } else {
    console.log(`Wysyłanie: ${str}`);
    try {
      //rs.sendData(str); // wysyła pojedynczy znak na serial
    } catch (e) {
      console.error('Błąd wysyłania:', e.message);
    }
  }
});
