var express = require('express');
var bodyParser = require('body-parser');
var PayOS = require('@payos/node');
var fs = require('fs/promises');

var app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('assets'));

var payOS = new PayOS("21728a88-99bf-40a8-b03e-5e0437580721",
    "11e1390a-0d64-4951-bd8c-873dd68c57e6",
    "8e33821fba42bf168544a41860666b16bd2e561bd76f0b517f22ad716616ffb9");

const IMG_SRC = "/img/cover.jpg";
const TITLE = "Bí mật của may mắn";
const PRICE = 2000;

const BOOK_URL = "https://drive.google.com/file/d/1DaoW9CH7ri29mHZ5Qtxl6uMo-wH3X4ol/view";

const DOMAIN = "http://localhost:8080";

// Automatically allocate new orderCode
// Next available code will be written to max_order_code.txt
const getNewOrderCode = async () => {
    let buffer = await fs.readFile("./max_order_code.txt");
    let currentCode = parseInt(buffer);
    let nextCode = currentCode + 1;
    await fs.writeFile("./max_order_code.txt", nextCode.toString());
    return currentCode;
}

app.get('/', (req, res) => {
    res.render("./index", { img_src: IMG_SRC, title: TITLE, price: PRICE });
})

app.get('/success', (req, res) => {
    res.render("./success", { img_src: IMG_SRC, title: TITLE, book_url: BOOK_URL });
})

app.get('/cancel', (req, res) => {
    res.render("./cancel", { img_src: IMG_SRC, title: TITLE });
})

app.post("/payment", async (req, res) => {
    try {
        let orderCode = await getNewOrderCode();
        const order = {
            orderCode: orderCode,
            amount: PRICE,
            description: "Thanh toan tien sach",
            returnUrl: DOMAIN + "/success",
            cancelUrl: DOMAIN + "/cancel"
        }
        const paymentLink = await payOS.createPaymentLink(order);
        res.redirect(303, paymentLink.checkoutUrl);
    }
    catch (err) {
        res.status(500).json();
    }
})

// Webhook API: https://a3ea-27-3-32-80.ngrok-free.app/receive-hook
app.post("/receive-hook", async (req, res) => {
    console.log(req.body);

    // Store information to fake_database.txt
    await fs.appendFile("./fake_database.txt", JSON.stringify(req.body));
    
    res.json();
})

app.listen(8080);