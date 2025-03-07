require('dotenv').config();
const express = require('express');
const admin = require('firebase-admin');
const QRCode = require('qrcode');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configurar Firebase con variables de entorno
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    })
});

const db = admin.firestore();

async function generarID() {
    const snapshot = await db.collection('mascotas').get();
    return snapshot.size + 1;
}

// Formulario de ingreso
app.get('/', (req, res) => {
    res.render('formulario');
});

// Guardar mascota y generar QR
app.post('/agregar', async (req, res) => {
    const { name, owner, contact } = req.body;
    const idMascota = await generarID();

    await db.collection('mascotas').doc(idMascota.toString()).set({
        id: idMascota,
        name,
        owner,
        contact,
    });

    const url = `${req.protocol}://${req.get('host')}/mascota/${idMascota}`;
    const qrcode = await QRCode.toDataURL(url);

    res.render('qr', { name, idMascota, qrcode });
});

// Mostrar los datos de la mascota
app.get('/mascota/:id', async (req, res) => {
    const doc = await db.collection('mascotas').doc(req.params.id).get();

    if (!doc.exists) return res.status(404).send('Mascota no encontrada');

    res.render('mascota', { mascota: doc.data() });
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
