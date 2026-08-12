NEDOCS ไทย — แอปมือถือ + Google Sheets
โปรเจกต์นี้เป็น PWA สำหรับ iPhone/Android ใช้งานภาษาไทยและบันทึกผลลง Google Sheets ผ่าน Google Apps Script
สูตร NEDOCS ที่ใช้
Score = -20
85.8 × (ผู้ป่วยทั้งหมดใน ER / เตียง ER)
600 × (Admit รอเตียง / เตียงผู้ป่วยใน)
13.4 × (ผู้ป่วย 1:1 / Ventilator)
0.93 × (Admit ที่รอนานที่สุดเป็นชั่วโมง)
5.64 × (Door-to-bed ล่าสุดเป็นชั่วโมง)
ระบบแสดงคะแนน 0–200 โดยจำกัดค่าสูงสุดที่ 200
ระดับที่ใช้:
0–20: ไม่แออัด
21–60: ค่อนข้างยุ่ง
61–100: ยุ่งมาก
101–140: แออัด
141–180: แออัดรุนแรง
181–200: แออัดระดับอันตราย
ติดตั้ง Google Sheets
สร้าง Google Sheet ใหม่
ไปที่ Extensions > Apps Script
เปิดไฟล์ Code.gs จากชุดนี้ แล้วคัดลอกทั้งหมดไปวาง
กด Save
Deploy > New deployment
Type: Web app
Execute as: Me
Who has access: Anyone
Deploy
คัดลอก Web app URL ที่ลงท้ายด้วย /exec
ติดตั้งเว็บแอป
ไฟล์ index.html, style.css, app.js, manifest.json, sw.js และ icon.svg ต้องอยู่ใน hosting ที่เปิดผ่าน HTTPS
ตัวเลือกที่ง่าย:
GitHub Pages
Netlify
Cloudflare Pages
Firebase Hosting
เปิด URL บน iPhone ด้วย Safari แล้ว:
Share > Add to Home Screen
เชื่อม Google Sheets
ในแอป:
⚙️ > ใส่ Google Apps Script URL > บันทึก
จากนั้นคำนวณ NEDOCS แล้วกด "บันทึกลง Google Sheets"
หมายเหตุด้านความปลอดภัย
อย่าบันทึกชื่อผู้ป่วย, HN, เลขบัตรประชาชน หรือข้อมูลที่ระบุตัวบุคคลได้ลงใน Sheet นี้ หากยังไม่ได้ผ่านการประเมินเรื่องสิทธิ์การเข้าถึงและนโยบายข้อมูลของหน่วยงาน
แอปนี้เป็นเครื่องมือคำนวณ/ติดตามความแออัด ไม่ใช่ระบบสั่งการทางคลินิก
