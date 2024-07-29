const fileInput = document.getElementById('file');
const fileName = document.getElementById('file-name');
const errorMessage = document.getElementById('error-message');

fileInput.addEventListener('change', (event) => {
  const selectedFile = event.target.files[0];
  if (selectedFile) {
    fileName.textContent = selectedFile.name;
    fileName.style.display = 'block'; // แสดงชื่อไฟล์
    errorMessage.style.display = 'none'; // ซ่อนข้อความเตือน
  } else {
    fileName.style.display = 'none'; // ซ่อนชื่อไฟล์
  }
});

const form = document.querySelector('form');
form.addEventListener('submit', (event) => {
  if (!fileInput.files.length) { // ตรวจสอบว่ามีไฟล์เลือกหรือไม่
    event.preventDefault(); // ป้องกันการ submit form
    errorMessage.style.display = 'block'; // แสดงข้อความเตือน
  }
});
