const PDFMerge = require('pdf-merge');
const fs = require('fs');
const express = require('express');
const app = express();
const multer = require('multer');
// const storage = multer.memoryStorage();
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, `${__dirname}/tmp/my-uploads`)
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now())
    }
});
const upload = multer({storage: storage});
const pino = require('pino');
const expressPino = require('express-pino-logger');
const stream = require('stream');

const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);

const logLevel = process.env.LOG_LEVEL || 'debug';
console.log(`Log level is ${logLevel}`);
const logger = pino({ level: logLevel });//FIXME: change this back to info
const expressLogger = expressPino({ logger });
app.use(expressLogger);

app.get('/', function (req, res) {
    fs.readFile('home.html', function (err, data) {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data);
        res.end();
    });
});

app.post('/api/upload-pdf', upload.array("pdfs", 10), function (req, res) {
    req.log.info('The form was submitted with this info:');
    //Save as new file
    let filePaths = [];
    req.files.forEach(function (file) {
        filePaths.push(file.path);
        logger.info('We got these files paths: %s', file.path);
    });

    PDFMerge(filePaths)
        .then((buffer) => {
            logger.info("DONE Merging!");
            // res.download(buffer);

            let readStream = new stream.PassThrough();
            readStream.end(buffer);

            res.set('Content-disposition', 'attachment; filename=' + 'concatenated-pdf.pdf');
            res.set('Content-Type', 'application/pdf');

            readStream.pipe(res);
            filePaths.forEach(path => {
                unlinkAsync(path, (err) => {
                    if (err) throw err;
                    logger.info(`Deleted file at path: ${path}`);
                });
            });
        });
});

app.listen(3001, function () {
    console.log('Listening on port 3001...');
});
