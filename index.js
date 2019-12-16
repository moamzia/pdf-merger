const PDFMerge = require('pdf-merge');
const fs = require('fs');
const express = require('express');
const app = express();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({storage: storage});
const pino = require('pino');
const expressPino = require('express-pino-logger');

const logger = pino({ level: process.env.LOG_LEVEL || 'debug' });//FIXME: change this back to info
const expressLogger = expressPino({ logger });
app.use(expressLogger);

app.get('/', function (req, res) {
    console.log("");
    fs.readFile('home.html', function (err, data) {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data);
        res.end();
    });
});

app.post('/api/upload-pdf', upload.array("pdfs", 10), function (req, res) {
    //Save as new file
    let filePaths = [];
    req.files.forEach(function (file) {
        filePaths.push(file.path);
    });
    PDFMerge(filePaths)
        .then((buffer) => {
            console.log("DONE!");
            res.download(buffer);
        });
});

app.listen(3001, function () {
    console.log('Listening on port 3001...');
});
