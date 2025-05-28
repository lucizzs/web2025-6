const { program } = require('commander');
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

program
    .requiredOption('-h, --host <host>', 'server host')
    .requiredOption('-p, --port <port>', 'server port')
    .requiredOption('-c, --cache <path>', 'cache folder path');

program.parse(process.argv);
const options = program.opts();
const cacheDir = options.cache;

const app = express();
const upload = multer();

if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
}

app.use(express.text());
app.use(express.urlencoded({ extended: true }));

const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/UploadForm.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'UploadForm.html'));
});

app.get('/notes', (req, res) => {
    const files = fs.readdirSync(cacheDir);
    const notes = files.map(name => ({
        name,
        text: fs.readFileSync(path.join(cacheDir, name), 'utf-8')
    }));
    res.status(200).json(notes);
});

app.get('/notes/:name', (req, res) => {
    const filePath = path.join(cacheDir, req.params.name);
    if (!fs.existsSync(filePath)) return res.sendStatus(404);
    res.send(fs.readFileSync(filePath, 'utf-8'));
});

app.put('/notes/:name', (req, res) => {
    const filePath = path.join(cacheDir, req.params.name);
    if (!fs.existsSync(filePath)) return res.sendStatus(404);
    fs.writeFileSync(filePath, req.body);
    res.sendStatus(200);
});

app.delete('/notes/:name', (req, res) => {
    const filePath = path.join(cacheDir, req.params.name);
    if (!fs.existsSync(filePath)) return res.sendStatus(404);
    fs.unlinkSync(filePath);
    res.sendStatus(200);
});

app.post('/write', upload.none(), (req, res) => {
    const { note_name, note } = req.body;
    const filePath = path.join(cacheDir, note_name);
    if (fs.existsSync(filePath)) return res.sendStatus(400);
    fs.writeFileSync(filePath, note);
    res.sendStatus(201);
});

app.listen(options.port, options.host, () => {
    console.log(`Server running at http://${options.host}:${options.port}`);
});
