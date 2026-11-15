const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
function toBanglaNumber(num) {
    if (num === null || num === undefined) return '';
    return num.toString().replace(/\d/g, d => bnDigits[d]);
}
function toEnglishNumber(str) {
    if (!str) return '';
    return str.toString().replace(/[০-৯]/g, d => bnDigits.indexOf(d));
}

const defaultSubjects = [
    "কালিমা ও আসমাউল হুসনাহ",
    "বাংলা",
    "ইংরেজী",
    "কুরআন মাজীদ ও তাজভীদ",
    "আরবী লেখা",
    "মাসআলাহ ও আদইয়ায়ে সলাহ",
    "গণিত",
    "হাদিস শরীফ ও আদইয়ায়ে মাসনূনাহ"
];

const defaultGrades = [
    { grade: "A+", range: "৮০% বা তদূর্ধ্ব", point: 5.00, minPercent: 80 },
    { grade: "A", range: "৭০% - ৭৯%", point: 4.00, minPercent: 70 },
    { grade: "A-", range: "৬০% - ৬৯%", point: 3.50, minPercent: 60 },
    { grade: "B", range: "৫০% - ৫৯%", point: 3.00, minPercent: 50 },
    { grade: "C", range: "৪০% - ৪৯%", point: 2.50, minPercent: 40 },
    { grade: "D", range: "৩৩% - ৩৯%", point: 2.00, minPercent: 33 },
    { grade: "F", range: "০% - ৩২%", point: 0.00, minPercent: 0 }
];

const defaultStudents = [
    { dakhila: "26001", name: "মোঃ শোয়াইব ইসলাম", father: "মোঃ আব্দুল করিম", mother: "ফাতেমা বেগম", location: "সখিপুর, টাঙ্গাইল", marks: [100, 98, 100, 100, 100, 100, 100, 100] },
    { dakhila: "26002", name: "মোঃ এস, এম, আবু বকর", father: "মোঃ রফিকুল ইসলাম", mother: "আয়েশা খাতুন", location: "কাকড়াজান, সখিপুর", marks: [100, 100, 100, 97, 100, 100, 100, 100] },
    { dakhila: "26003", name: "সাএদা ইসলাম", father: "আব্দুল লতিফ", mother: "সাজেদা বেগম", location: "বটতলা, সখিপুর", marks: [100, 100, 100, 100, 99, 100, 97, 100] }
];

const defaultHeaderInfo = {
    madrasaName: "দারুল উলূম নূরুল হারামাইন মাদরাসা",
    madrasaAddress: "সখিপুর পৌরসভা, সখিপুর, টাঙ্গাইল।",
    examTitle: "দ্বিতীয় সাময়িক পরীক্ষা : ২০২৬",
    classTitle: "জামাত: দ্বিতীয় শ্রেণী",
    logoData: null
};

let subjectsList = JSON.parse(localStorage.getItem('madrasa_dynamic_subjects')) || [...defaultSubjects];
let gradesList = JSON.parse(localStorage.getItem('madrasa_dynamic_grades')) || [...defaultGrades];
let students = JSON.parse(localStorage.getItem('madrasa_dynamic_students')) || JSON.parse(JSON.stringify(defaultStudents));
let headerInfo = JSON.parse(localStorage.getItem('madrasa_dynamic_header')) || { ...defaultHeaderInfo };

function calculateResult(marks) {
    const totalSubjects = subjectsList.length;
    const maxTotal = totalSubjects * 100;
    const total = marks.reduce((sum, m) => sum + Number(m), 0);
    const hasFailedSubject = marks.some(m => Number(m) < 33);
    const passMarkSum = totalSubjects * 33;

    if (hasFailedSubject || total < passMarkSum) {
        return { total, maxTotal, grade: "F", point: "0.00", passed: false };
    }

    const percentage = (total / maxTotal) * 100;
    let matchedGrade = gradesList.filter(g => g.grade !== "F").sort((a,b) => b.minPercent - a.minPercent)[0] || { grade: "D", point: 2.00 };
    for (let g of gradesList) {
        if (percentage >= g.minPercent) {
            matchedGrade = g;
            break;
        }
    }

    return { total, maxTotal, grade: matchedGrade.grade, point: matchedGrade.point.toFixed(2), passed: true };
}

function computeMeritRanks(studentList) {
    const enriched = studentList.map((st, idx) => {
        if(!st.father) st.father = "Sakibullah";
        if(!st.mother) st.mother = "Sakina Begum";
        if(!st.location) st.location = "সখিপুর, টাঙ্গাইল";

        while(st.marks.length < subjectsList.length) st.marks.push(80);
        if(st.marks.length > subjectsList.length) st.marks = st.marks.slice(0, subjectsList.length);

        const res = calculateResult(st.marks);
        return { ...st, originalIndex: idx, ...res };
    });

    const passedStudents = enriched.filter(s => s.passed).sort((a, b) => b.total - a.total);
    let currentRank = 0, lastTotal = null;

    passedStudents.forEach((st) => {
        if (st.total !== lastTotal) {
            currentRank++;
            lastTotal = st.total;
        }
        st.merit = currentRank;
    });

    enriched.sort((a, b) => {
        if (a.passed && !b.passed) return -1;
        if (!a.passed && b.passed) return 1;
        return b.total - a.total;
    });

    return enriched;
}

function renderHeader() {
    document.getElementById('dispMadrasaName').innerText = headerInfo.madrasaName;
    document.getElementById('dispMadrasaAddress').innerText = headerInfo.madrasaAddress;
    document.getElementById('dispExamTitle').innerText = headerInfo.examTitle;
    document.getElementById('dispClassTitle').innerText = headerInfo.classTitle;

    const logoContainer = document.getElementById('logoContainer');
    if (headerInfo.logoData) {
        logoContainer.innerHTML = `<img src="${headerInfo.logoData}" alt="Logo">`;
    }
}

function renderTableHeaders() {
    const headerRow = document.getElementById('tableHeaderRow');
    if (!headerRow) return;
    
    let subHeadersHtml = '';
    subjectsList.forEach((sub) => {
        subHeadersHtml += `
            <th style="min-width: 65px;">
                ${sub}<br>
                <span style="font-size: 11px; font-weight: normal; color: #be0000;">পূর্ণমান - 100</span>
            </th>
        `;
    });

    headerRow.innerHTML = `
        <th style="width: 38px;">ক্রমিক</th>
        <th style="width: 55px;">দাখিলা</th>
        <th class="col-name">পরীক্ষার্থীর নাম</th>
        ${subHeadersHtml}
        <th style="width: 50px;">মোট</th>
        <th style="width: 45px;">গ্রেড</th>
        <th style="width: 48px;">পয়েন্ট</th>
        <th style="width: 42px;">মেধা</th>
        <th class="no-print" style="width: 75px;">অ্যাকশন</th>
    `;

    const gradeBody = document.getElementById('gradeChartHeader').parentElement.nextElementSibling;
    if (gradeBody) {
        gradeBody.innerHTML = '';
        gradesList.forEach(g => {
            gradeBody.innerHTML += `<tr><td>${g.grade}</td><td>${g.range}</td></tr>`;
        });
    }
}

function renderTable() {
    renderTableHeaders();
    const tbody = document.getElementById('resultTableBody');
    if (!tbody) return;
    
    const searchQuery = document.getElementById('searchInput').value.trim().toLowerCase();
    const rankedStudents = computeMeritRanks(students);
    tbody.innerHTML = '';

    let serial = 1;
    rankedStudents.forEach((st) => {
        const matchName = st.name.toLowerCase().includes(searchQuery);
        const matchDakhila = toBanglaNumber(st.dakhila).includes(searchQuery) || toEnglishNumber(st.dakhila).includes(searchQuery);
        if (searchQuery && !matchName && !matchDakhila) return;

        const tr = document.createElement('tr');
        let marksCells = '';
        st.marks.forEach(m => {
            const isFail = Number(m) < 33;
            // এখানে নম্বরগুলো ইংরেজি সংখ্যা হিসেবে রেন্ডার হবে
            marksCells += `<td class="${isFail ? 'fail-mark' : ''}">${m}</td>`;
        });

        let meritDisplay = st.passed ? toBanglaNumber(st.merit) : '-';
        if (st.merit === 1 && st.passed) meritDisplay = 'প্রথম স্থান 🏆';
        else if (st.merit === 2 && st.passed) meritDisplay = 'দ্বিতীয় স্থান 🥈';
        else if (st.merit === 3 && st.passed) meritDisplay = 'তৃতীয় স্থান 🥉';

        tr.innerHTML = `
            <td>${toBanglaNumber(serial++)}</td>
            <td>${toBanglaNumber(st.dakhila)}</td>
            <td class="col-name">${st.name}</td>
            ${marksCells}
            <td style="font-weight: 700;">${st.total}</td>
            <td class="${!st.passed ? 'grade-f' : ''}" style="font-weight: 600;">${st.grade}</td>
            <td>${st.point}</td>
            <td style="font-weight: 600;">${meritDisplay}</td>
            <td class="no-print action-cell">
                <button class="icon-btn" title="মার্কশিট" onclick="viewMarksheet(${st.originalIndex}, '${meritDisplay}')">Marksheet</button>
                <button class="icon-btn" title="এডিট" onclick="openEditModal(${st.originalIndex})">Edit</button>
                <button class="icon-btn del" title="ডিলিট" onclick="deleteStudent(${st.originalIndex})">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openBulkEntryModal() {
    const theadRow = document.getElementById('bulkTableHeader');
    if (theadRow) {
        let thHtml = `<th style="width:60px;">দাখিলা</th><th style="min-width:140px; text-align:left; padding-left:8px;">নাম</th>`;
        subjectsList.forEach((sub) => {
            thHtml += `<th>${sub} <br><span style="font-size:10px; font-weight:normal;">(100)</span></th>`;
        });
        thHtml += `<th style="width:50px;">Delete</th>`;
        theadRow.innerHTML = thHtml;
    }

    renderBulkRows();
    document.getElementById('bulkEntryModal').style.display = 'flex';
}

function renderBulkRows() {
    const tbody = document.getElementById('bulkTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    students.forEach((st) => {
        let tdHtml = `
            <td><input type="text" class="b-dakhila" value="${st.dakhila}" style="width:55px; padding:4px; text-align:center; border:1px solid #cbd5e1; border-radius:4px;"></td>
            <td style="text-align:left; padding-left:8px;"><input type="text" class="b-name" value="${st.name}" style="width:130px; padding:4px; border:1px solid #cbd5e1; border-radius:4px;"></td>
        `;

        subjectsList.forEach((sub, subIndex) => {
            const mark = (st.marks && st.marks[subIndex] !== undefined) ? st.marks[subIndex] : 80;
            tdHtml += `<td><input type="number" min="0" max="100" class="b-mark-${subIndex}" value="${mark}" style="width:55px; padding:4px; text-align:center; border:1px solid #cbd5e1; border-radius:4px;"></td>`;
        });

        tdHtml += `<td><button type="button" class="btn btn-danger" style="padding:2px 6px; font-size:11px;" onclick="removeBulkRow(this)">❌</button></td>`;
        tbody.innerHTML += `<tr class="bulk-row">${tdHtml}</tr>`;
    });
}

function addBulkRow() {
    const tbody = document.getElementById('bulkTableBody');
    if (!tbody) return;

    let tdHtml = `
        <td><input type="text" class="b-dakhila" value="" placeholder="রোল" style="width:55px; padding:4px; text-align:center; border:1px solid #cbd5e1; border-radius:4px;"></td>
        <td style="text-align:left; padding-left:8px;"><input type="text" class="b-name" value="" placeholder="শিক্ষার্থীর নাম" style="width:130px; padding:4px; border:1px solid #cbd5e1; border-radius:4px;"></td>
    `;

    subjectsList.forEach((sub, subIndex) => {
        tdHtml += `<td><input type="number" min="0" max="100" class="b-mark-${subIndex}" value="80" style="width:55px; padding:4px; text-align:center; border:1px solid #cbd5e1; border-radius:4px;"></td>`;
    });

    tdHtml += `<td><button type="button" class="btn btn-danger" style="padding:2px 6px; font-size:11px;" onclick="removeBulkRow(this)">Delete</button></td>`;
    
    const tr = document.createElement('tr');
    tr.className = 'bulk-row';
    tr.innerHTML = tdHtml;
    tbody.appendChild(tr);
}

function removeBulkRow(btn) {
    const tr = btn.closest('tr');
    if(tr) tr.remove();
}

function closeBulkEntryModal() {
    document.getElementById('bulkEntryModal').style.display = 'none';
}

function saveBulkMarks() {
    const rows = document.querySelectorAll('.bulk-row');
    let newStudentsList = [];

    rows.forEach(row => {
        const dakhilaVal = row.querySelector('.b-dakhila').value.trim();
        const nameVal = row.querySelector('.b-name').value.trim();
        
        if (dakhilaVal && nameVal) {
            let marksArr = [];
            subjectsList.forEach((sub, subIndex) => {
                const markInput = row.querySelector(`.b-mark-${subIndex}`);
                marksArr.push(markInput ? (parseInt(markInput.value) || 0) : 80);
            });

            newStudentsList.push({
                dakhila: dakhilaVal,
                name: nameVal,
                father: "Sakibullah",
                mother: "Sakina Begum",
                location: "সখিপুর, টাঙ্গাইল",
                marks: marksArr
            });
        }
    });

    if(newStudentsList.length === 0) {
        return alert('কমপক্ষে একজনের দাখিলা ও নাম পূরণ করুন!');
    }

    students = newStudentsList;
    saveAll();
    closeBulkEntryModal();
    renderAll();
    alert('সকল শিক্ষার্থীর তথ্য ও নম্বর সফলভাবে সংরক্ষণ করা হয়েছে!');
}

function openEditModal(index) {
    const st = students[index];
    document.getElementById('modalTitle').innerText = "পরীক্ষার্থীর তথ্য ও নম্বর এডিট করুন";
    document.getElementById('editIndex').value = index;
    document.getElementById('inDakhila').value = st.dakhila;
    document.getElementById('inName').value = st.name;
    document.getElementById('inFather').value = st.father || "";
    document.getElementById('inMother').value = st.mother || "";
    document.getElementById('inLocation').value = st.location || "";
    generateModalSubjectInputs(st.marks);
    document.getElementById('studentModal').style.display = 'flex';
}

function openAddModal() {
    document.getElementById('modalTitle').innerText = "নতুন পরীক্ষার্থীর নম্বর যোগ করুন";
    document.getElementById('editIndex').value = "-1";
    document.getElementById('studentForm').reset();
    document.getElementById('inFather').value = "";
    document.getElementById('inMother').value = "";
    document.getElementById('inLocation').value = "";
    generateModalSubjectInputs();
    document.getElementById('studentModal').style.display = 'flex';
}

function closeStudentModal() { document.getElementById('studentModal').style.display = 'none'; }

function saveStudent(e) {
    e.preventDefault();
    const editIdx = parseInt(document.getElementById('editIndex').value);
    const dakhila = document.getElementById('inDakhila').value.trim();
    const name = document.getElementById('inName').value.trim();
    const father = document.getElementById('inFather').value.trim();
    const mother = document.getElementById('inMother').value.trim();
    const location = document.getElementById('inLocation').value.trim();
    const marks = [];
    for (let i = 0; i < subjectsList.length; i++) {
        marks.push(parseInt(document.getElementById(`modalSub_${i}`).value) || 0);
    }

    if (editIdx === -1) {
        students.push({ dakhila, name, father, mother, location, marks });
    } else {
        students[editIdx] = { dakhila, name, father, mother, location, marks };
    }

    saveAll();
    closeStudentModal();
    renderTable();
}

function deleteStudent(index) {
    if (confirm(`আপনি কি "${students[index].name}"-এর ফলাফল মুছে ফেলতে চান?`)) {
        students.splice(index, 1);
        saveAll();
        renderTable();
    }
}

function openHeaderModal() {
    document.getElementById('inMadrasaName').value = headerInfo.madrasaName;
    document.getElementById('inMadrasaAddress').value = headerInfo.madrasaAddress;
    document.getElementById('inExamTitle').value = headerInfo.examTitle;
    document.getElementById('inClassTitle').value = headerInfo.classTitle;
    document.getElementById('headerModal').style.display = 'flex';
}
function closeHeaderModal() { document.getElementById('headerModal').style.display = 'none'; }

function saveHeaderInfo(e) {
    e.preventDefault();
    const fileInput = document.getElementById('inLogoFile');
    headerInfo.madrasaName = document.getElementById('inMadrasaName').value.trim();
    headerInfo.madrasaAddress = document.getElementById('inMadrasaAddress').value.trim();
    headerInfo.examTitle = document.getElementById('inExamTitle').value.trim();
    headerInfo.classTitle = document.getElementById('inClassTitle').value.trim();

    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(event) {
            headerInfo.logoData = event.target.result;
            saveAll();
            renderHeader();
            closeHeaderModal();
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        saveAll();
        renderHeader();
        closeHeaderModal();
    }
}

function renderGradeManagerList() {
    const container = document.getElementById('gradeListContainer');
    if (!container) return;
    container.innerHTML = '';
    gradesList.forEach((g, i) => {
        container.innerHTML += `
            <div style="display: flex; gap: 6px; margin-bottom: 6px; align-items: center; font-size: 13px;">
                <input type="text" id="gName_${i}" value="${g.grade}" style="width: 55px; padding: 4px; border:1px solid #cbd5e1; border-radius:4px;">
                <input type="text" id="gRange_${i}" value="${g.range}" style="flex-grow:1; padding: 4px; border:1px solid #cbd5e1; border-radius:4px;">
                <input type="number" id="gPoint_${i}" value="${g.point}" step="0.25" style="width: 60px; padding: 4px; border:1px solid #cbd5e1; border-radius:4px;">
                <button class="btn btn-danger" style="padding:3px 6px; font-size:11px;" onclick="removeGrade(${i})">Remove</button>
                <button class="btn btn-primary" style="padding:3px 6px; font-size:11px;" onclick="updateGrade(${i})">Update</button>
            </div>
        `;
    });
}

function openGradeManagerModal() {
    renderGradeManagerList();
    document.getElementById('gradeManagerModal').style.display = 'flex';
}
function closeGradeManagerModal() { document.getElementById('gradeManagerModal').style.display = 'none'; }

function addNewGrade() {
    const grade = document.getElementById('newGradeName').value.trim();
    const range = document.getElementById('newGradeRange').value.trim();
    const point = parseFloat(document.getElementById('newGradePoint').value) || 0;
    if(!grade || !range) return alert('সব তথ্য পূরণ করুন!');

    gradesList.push({ grade, range, point, minPercent: 0 });
    document.getElementById('newGradeName').value = '';
    document.getElementById('newGradeRange').value = '';
    document.getElementById('newGradePoint').value = '';
    saveAll();
    renderGradeManagerList();
    renderAll();
}

function updateGrade(i) {
    gradesList[i].grade = document.getElementById(`gName_${i}`).value.trim();
    gradesList[i].range = document.getElementById(`gRange_${i}`).value.trim();
    gradesList[i].point = parseFloat(document.getElementById(`gPoint_${i}`).value) || 0;
    saveAll();
    renderAll();
    alert('গ্রেড আপডেট হয়েছে!');
}

function removeGrade(i) {
    if(gradesList.length <= 1) return alert('কমপক্ষে একটি গ্রেড রাখা আবশ্যক!');
    gradesList.splice(i, 1);
    saveAll();
    renderGradeManagerList();
    renderAll();
}

function renderSubjectManagerList() {
    const container = document.getElementById('subjectListContainer');
    if (!container) return;
    container.innerHTML = '';
    subjectsList.forEach((sub, i) => {
        container.innerHTML += `
            <div style="display: flex; gap: 8px; margin-bottom: 8px; align-items: center;">
                <span style="font-weight:bold; width:25px;">${toBanglaNumber(i+1)}.</span>
                <input type="text" id="subInput_${i}" value="${sub}" style="flex-grow:1; padding:5px; border:1px solid #cbd5e1; border-radius:4px;">
                <button class="btn btn-danger" style="padding:4px 8px; font-size:12px;" onclick="removeSubject(${i})">Delete</button>
                <button class="btn btn-primary" style="padding:4px 8px; font-size:12px;" onclick="updateSingleSubject(${i})">Save</button>
            </div>
        `;
    });
}

function openSubjectManagerModal() {
    renderSubjectManagerList();
    document.getElementById('subjectManagerModal').style.display = 'flex';
}
function closeSubjectManagerModal() { document.getElementById('subjectManagerModal').style.display = 'none'; }

function addNewSubject() {
    const input = document.getElementById('newSubjectName');
    const val = input.value.trim();
    if (!val) return alert('দয়া করে বিষয়ের নাম লিখুন!');
    subjectsList.push(val);
    students.forEach(st => st.marks.push(80));
    input.value = '';
    saveAll();
    renderSubjectManagerList();
    renderAll();
}

function updateSingleSubject(i) {
    const val = document.getElementById(`subInput_${i}`).value.trim();
    if(!val) return alert('বিষয়ের নাম খালি রাখা যাবে না!');
    subjectsList[i] = val;
    saveAll();
    renderAll();
    alert('বিষয় আপডেট হয়েছে!');
}

function removeSubject(i) {
    if(subjectsList.length <= 1) return alert('কমপক্ষে একটি বিষয় রাখা আবশ্যক!');
    if(confirm(`"${subjectsList[i]}" বিষয়টি মুছে ফেলতে চান?`)) {
        subjectsList.splice(i, 1);
        students.forEach(st => st.marks.splice(i, 1));
        saveAll();
        renderSubjectManagerList();
        renderAll();
    }
}

function generateModalSubjectInputs(studentMarks = null) {
    const container = document.getElementById('modalSubjectsContainer');
    if (!container) return;
    container.innerHTML = '';
    subjectsList.forEach((sub, i) => {
        const val = studentMarks ? studentMarks[i] : 80;
        container.innerHTML += `
            <div class="form-group">
                <label>${toBanglaNumber(i+1)}. ${sub} (১০০)</label>
                <input type="number" id="modalSub_${i}" min="0" max="100" required value="${val}">
            </div>
        `;
    });
}

function viewMarksheet(index, merit) {
    const st = students[index];
    const res = calculateResult(st.marks);

    document.getElementById('mMadrasaName').innerText = headerInfo.madrasaName;
    document.getElementById('mMadrasaAddress').innerText = headerInfo.madrasaAddress;
    document.getElementById('mExamTitle').innerText = headerInfo.examTitle;
    document.getElementById('mClassTitle').innerText = headerInfo.classTitle;

    document.getElementById('mName').innerText = st.name;
    document.getElementById('mDakhila').innerText = toBanglaNumber(st.dakhila);
    document.getElementById('mFather').innerText = st.father || "Sakibullah";
    document.getElementById('mMother').innerText = st.mother || "Sakina Begum";
    document.getElementById('mLocation').innerText = st.location || "সখিপুর, টাঙ্গাইল";

    let rowsHtml = '';
    subjectsList.forEach((sub, i) => {
        const mark = st.marks[i]; // ইংরেজি সংখ্যা হিসেবে নম্বর রাখা হয়েছে
        const isFail = mark < 33;
        rowsHtml += `
            <tr>
                <td style="border: 1px solid #15803d; padding: 6px;">${toBanglaNumber(i+1)}</td>
                <td style="border: 1px solid #15803d; padding: 6px; text-align: left; padding-left: 10px;">${sub}</td>
                <td style="border: 1px solid #15803d; padding: 6px;">১০০</td>
                <td style="border: 1px solid #15803d; padding: 6px; font-weight: bold; color: ${isFail ? 'red' : '#000'};">${mark}</td>
                <td style="border: 1px solid #15803d; padding: 6px;">${isFail ? 'F' : res.grade}</td>
                <td style="border: 1px solid #15803d; padding: 6px;">${isFail ? '0.00' : res.point}</td>
            </tr>
        `;
    });

    document.getElementById('mSubjectsTableBody').innerHTML = rowsHtml;
    document.getElementById('mTotalObtained').innerText = res.total;
    document.getElementById('mFinalGrade').innerText = res.grade;
    document.getElementById('mFinalPoint').innerText = res.point;
    
    const passStatusEl = document.getElementById('mPassStatus');
    passStatusEl.innerText = res.passed ? "কৃতকার্য" : "অকৃতকার্য";
    passStatusEl.style.color = res.passed ? "#15803d" : "#dc2626";
    
    document.getElementById('mMeritRank').innerText = merit;

    document.getElementById('marksheetModal').style.display = 'flex';
}

function closeMarksheetModal() { document.getElementById('marksheetModal').style.display = 'none'; }

function saveAll() {
    localStorage.setItem('madrasa_dynamic_subjects', JSON.stringify(subjectsList));
    localStorage.setItem('madrasa_dynamic_grades', JSON.stringify(gradesList));
    localStorage.setItem('madrasa_dynamic_students', JSON.stringify(students));
    localStorage.setItem('madrasa_dynamic_header', JSON.stringify(headerInfo));
}

function renderAll() {
    renderHeader();
    renderTable();
}

function resetDefaultData() {
    if (confirm("আপনি কি সব তথ্য রিসেট করতে চান?")) {
        localStorage.clear();
        subjectsList = [...defaultSubjects];
        gradesList = [...defaultGrades];
        students = JSON.parse(JSON.stringify(defaultStudents));
        headerInfo = { ...defaultHeaderInfo };
        renderAll();
    }
}

renderAll();