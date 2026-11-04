const express = require('express');
const app = express();

app.use(express.json());

// التخزين المؤقت في الذاكرة للسيرفر
const verificationCodes = {};
const users = {};
const messages = [];

// 1. مسار طلب كود التأكيد (للاختبار والتطوير)
app.post('/api/auth/send-code', (req, res) => {
    const { phoneNumber } = req.body;

    if (!phoneNumber || phoneNumber.length < 8) {
        return res.status(400).json({ success: false, message: 'رقم الهاتف غير صحيح' });
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    verificationCodes[phoneNumber] = code;

    console.log(`[We App SMS Gateway] تم إرسال الكود ${code} إلى الرقم ${phoneNumber}`);

    res.json({
        success: true,
        message: 'تم إرسال كود التأكيد بنجاح',
        code: code // إرجاع الكود للاختبار السريع
    });
});

// 2. مسار التحقق من كود التأكيد وتسجيل الدخول
app.post('/api/auth/verify-code', (req, res) => {
    const { phoneNumber, code } = req.body;

    if (verificationCodes[phoneNumber] && verificationCodes[phoneNumber] === code) {
        delete verificationCodes[phoneNumber]; 
        users[phoneNumber] = { phoneNumber, registeredAt: new Date() };

        return res.json({
            success: true,
            message: 'تم التحقق وتسجيل الدخول بنجاح',
            token: `token_${phoneNumber}_${Date.now()}`
        });
    }

    res.status(400).json({ success: false, message: 'كود التأكيد غير صحيح أو منتهي الصلاحية' });
});

// 3. مسار التحقق عبر المكالمة الفائتة (الطريقة المجانية البديلة)
app.post('/api/auth/verify-missed-call', (req, res) => {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
        return res.status(400).json({ success: false, message: 'رقم الهاتف مطلوب' });
    }

    users[phoneNumber] = { phoneNumber, registeredAt: new Date() };

    console.log(`[We App Missed Call] تم التحقق من رقم الهاتف بنجاح: ${phoneNumber}`);

    res.json({
        success: true,
        message: 'تم التحقق بنجاح',
        token: `token_${phoneNumber}_${Date.now()}`
    });
});

// 4. مسار إرسال رسالة جديدة
app.post('/api/messages/send', (req, res) => {
    const { sender, text, type } = req.body;

    if (!sender || !text) {
        return res.status(400).json({ success: false, message: 'بيانات الرسالة غير مكتملة' });
    }

    const newMessage = {
        id: messages.length + 1,
        sender,
        text,
        type: type || 'text',
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    messages.push(newMessage);

    res.json({ success: true, message: newMessage });
});

// 5. مسار جلب جميع الرسائل
app.get('/api/messages', (req, res) => {
    res.json({ success: true, messages });
});

// تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 السيرفر السحابي لتطبيق com.we.app يعمل بنجاح على المنفذ: ${PORT}`);
});
