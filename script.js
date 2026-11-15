const defaultSubjects = [
    { name: "বাংলা", optional: true },
    { name: "ইংরেজী", optional: false },
    { name: "কুরআন মাজীদ ও তাজভীদ", optional: true },
    { name: "আরবী লেখা", optional: false }
];

const defaultGrades = [
    { grade: "ممتاز (A+)", range: "৮০% - ১০০%", point: 5.00, minPercent: 80 },
    { grade: "জায়্যিদ জিদ্দান (A)", range: "৭০% - ৭৯%", point: 4.00, minPercent: 70 },
    { grade: "জায়্যিদ (A-)", range: "৬০% - ৬৯%", point: 3.50, minPercent: 60 },
    { grade: "মকবুল (B)", range: "৫০% - ৫৯%", point: 3.00, minPercent: 50 },
    { grade: "রাসিব (F)", range: "০% - ৪৯%", point: 0.00, minPercent: 0 }
];

const defaultStudents = [
    { dakhila: "2634", name: "সাএদা ইসলাম", father: "প্রযোজ্য নয়", mother: "প্রযোজ্য নয়", location: "সখিপুর, টাঙ্গাইল", marks: [87, 89, 89, 70] },
    { dakhila: "2671", name: "মোঃ শোয়াইব ইসলাম", father: "প্রযোজ্য নয়", mother: "প্রযোজ্য নয়", location: "সখিপুর, টাঙ্গাইল", marks: [10, 60, 20, 70] }
];

const defaultHeaderInfo = {
    madrasaName: "Nurul haramain",
    madrasaAddress: "সখিপুর পৌরসভা, সখিপুর, টাঙ্গাইল।",
    examTitle: "বেফাকুল মাদারিসিল আরাবিয়া বাংলাদেশ - ২০২৬",
    classTitle: "জামাত: হিফজ বিভাগ - ৩পারা",
    logoData: null
};

let isWifaqMode = JSON.parse(localStorage.getItem('madrasa_wifaq_mode')) || false;
let subjectsList = JSON.parse(localStorage.getItem('madrasa_dynamic_subjects')) || JSON.parse(JSON.stringify(defaultSubjects));
let gradesList = JSON.parse(localStorage.getItem('madrasa_dynamic_grades')) || [...defaultGrades];
let students = JSON.parse(localStorage.getItem('madrasa_dynamic_students')) || JSON.parse(JSON.stringify(defaultStudents));
let headerInfo = JSON.parse(localStorage.getItem('madrasa_dynamic_header')) || { ...defaultHeaderInfo };

function toggleWifaqMode() {
    isWifaqMode = !isWifaqMode;
    localStorage.setItem('madrasa_wifaq_mode', JSON.stringify(isWifaqMode));
    updateWifaqUIButton();
    renderAll();
}

function updateWifaqUIButton() {
    const btn = document.getElementById('wifaqToggleBtn');
    const badge = document.getElementById('systemTitleBadge');
    if (btn) {
        btn.innerHTML = isWifaqMode ? `<span>🌟</span> বেফাক মোড: চালু` : `<span>🌟</span> বেফাক মোড: বন্ধ`;
        btn.style.background = isWifaqMode ? "#15803d" : "#9333ea";
    }
    if (badge) {
        badge.innerHTML = isWifaqMode ? `<span>📜</span> বেফাক রেজাল্ট ম্যানেজমেন্ট সিস্টেম` : `<span>🕌</span> মাদরাসা রেজাল্ট ম্যানেজমেন্ট সিস্টেম`;
    }
}

function calculateResult(marks) {
    const totalSubjects = subjectsList.length;
    const maxTotal = totalSubjects * 100;
    const total = marks.reduce((sum, m) => sum + Number(m), 0);
    
    let generalFailed = false;

    // নিখুঁতভাবে চেক করা হচ্ছে সাবজেক্টটি ঐচ্ছিক কি না
    marks.forEach((m, idx) => {
        const sub = subjectsList[idx];
        const isOptional = (typeof sub === 'object' && sub.optional === true) || 
                           (typeof sub === 'string' && sub.includes('ঐচ্ছিক'));
        
        // যদি জেনারেল (মূল) সাবজেক্টে ৩৩ এর নিচে পায় তবেই কেবল জেনারেল ফেল ধরবে
        if (Number(m) < 33 && !isOptional) {
            generalFailed = true;
        }
    });

    let passed = true;
    if (isWifaqMode) {
        // বেফাক মোড বা আমাদের শর্ত অনুযায়ী জেনারেল সাবজেক্টে পাস থাকলে অপশোনালে ফেল করলেও পাস করবে
        if (generalFailed) {
            passed = false;
        } else {
            passed = true;
        }
    } else {
        const hasGeneralFail = marks.some((m, idx) => {
            const sub = subjectsList[idx];
            const isOpt = (typeof sub === 'object' && sub.optional === true) || 
                          (typeof sub === 'string' && sub.includes('ঐচ্ছিক'));
            return Number(m) < 33 && !isOpt;
        });
        const passMarkSum = totalSubjects * 33;
        if (hasGeneralFail || total < passMarkSum) {
            passed = false;
        }
    }

    if (!passed) {
        return { total, maxTotal, grade: "রাসিব (F)", point: "0.00", passed: false };
    }

    // পাস করলে মোট নম্বরের পার্সেন্টেজ অনুযায়ী গ্রেড ও পয়েন্ট নির্ধারিত হবে (অপশোনালে কম নম্বর পেলে মোট নম্বর কমে যাওয়ায় গ্রেড ও পয়েন্ট স্বয়ংক্রিয়ভাবে কমে যাবে)
    const percentage = (total / maxTotal) * 100;
    let matchedGrade = gradesList.filter(g => g.grade.includes("রাসিব") === false).sort((a,b) => b.minPercent - a.minPercent)[0] || { grade: "মকবুল (B)", point: 3.00 };
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
        if(!st.father) st.father = "প্রযোজ্য নয়";
        if(!st.mother) st.mother = "প্রযোজ্য নয়";
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
        const subName = typeof sub === 'string' ? sub : sub.name;
        const isOptProp = typeof sub === 'object' && sub.optional === true;
        const isOptName = subName.includes('ঐচ্ছিক');
        const isOpt = (isOptProp || isOptName);
        
        const displayName = isOptName ? subName : (isOpt ? `${subName} (ঐচ্ছিক)` : subName);

        subHeadersHtml += `
            <th style="min-width: 65px;">
                ${displayName}<br>
                <span style="font-size: 11px; font-weight: normal; color: #333;">পূর্ণমান - 100</span>
            </th>
        `;
    });

    headerRow.innerHTML = `
        <th style="width: 38px;">ক্রমিক</th>
        <th style="width: 55px;">দাখিলা</th>
        <th class="col-name">পরীক্ষার্থীর নাম</th>
        ${subHeadersHtml}
        <th style="width: 65px; background: #fef3c7; color: #78350f;">মোট নম্বর</th>
        <th style="width: 65px; background: #ecfdf5; color: #065f46;">প্রাপ্ত নম্বর</th>
        <th style="width: 65px;">গ্রেড / বিভাগ</th>
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
    updateWifaqUIButton();
    const tbody = document.getElementById('resultTableBody');
    if (!tbody) return;
    
    const searchQuery = document.getElementById('searchInput').value.trim().toLowerCase();
    const rankedStudents = computeMeritRanks(students);
    tbody.innerHTML = '';

    let serial = 1;
    rankedStudents.forEach((st) => {
        const matchName = st.name.toLowerCase().includes(searchQuery);
        const matchDakhila = st.dakhila.toLowerCase().includes(searchQuery);
        if (searchQuery && !matchName && !matchDakhila) return;

        const tr = document.createElement('tr');
        let marksCells = '';
        st.marks.forEach((m) => {
            const isFail = Number(m) < 33;
            marksCells += `<td class="${isFail ? 'fail-mark' : ''}">${m}</td>`;
        });

        let meritDisplay = st.passed ? st.merit : '-';
        if (st.merit === 1 && st.passed) meritDisplay = '1st';
        else if (st.merit === 2 && st.passed) meritDisplay = '2nd';
        else if (st.merit === 3 && st.passed) meritDisplay = '3rd';
        else if (st.passed) meritDisplay = `${st.merit}th`;

        tr.innerHTML = `
            <td>${serial++}</td>
            <td>${st.dakhila}</td>
            <td class="col-name">${st.name}</td>
            ${marksCells}
            <td style="font-weight: 700; background: #fffbeb;">${st.maxTotal}</td>
            <td style="font-weight: 700; background: #f0fdf4; color: #15803d;">${st.total}</td>
            <td class="${!st.passed ? 'grade-f' : ''}" style="font-weight: 600; font-size:12px;">${st.grade}</td>
            <td>${st.point}</td>
            <td style="font-weight: 600;">${meritDisplay}</td>
            <td class="no-print action-cell">
                <button class="icon-btn" title="মার্কশিট" onclick="viewMarksheet(${st.originalIndex})">📄</button>
                <button class="icon-btn" title="এডিট" onclick="openEditModal(${st.originalIndex})">✏️</button>
                <button class="icon-btn del" title="ডিলিট" onclick="deleteStudent(${st.originalIndex})">🗑️</button>
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
            const subName = typeof sub === 'string' ? sub : sub.name;
            thHtml += `<th>${subName} <br><span style="font-size:10px; font-weight:normal;">(100)</span></th>`;
        });
        thHtml += `<th style="width:50px;">অ্যাকশন</th>`;
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
        <td style="text-align:left; padding-left:8px;"><input type="text" class="b-name" value="" placeholder="নাম" style="width:130px; padding:4px; border:1px solid #cbd5e1; border-radius:4px;"></td>
    `;

    subjectsList.forEach((sub, subIndex) => {
        tdHtml += `<td><input type="number" min="0" max="100" class="b-mark-${subIndex}" value="80" style="width:55px; padding:4px; text-align:center; border:1px solid #cbd5e1; border-radius:4px;"></td>`;
    });

    tdHtml += `<td><button type="button" class="btn btn-danger" style="padding:2px 6px; font-size:11px;" onclick="removeBulkRow(this)">❌</button></td>`;
    
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
                father: "প্রযোজ্য নয়",
                mother: "প্রযোজ্য নয়",
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
                <input type="text" id="gName_${i}" value="${g.grade}" style="width: 85px; padding: 4px; border:1px solid #cbd5e1; border-radius:4px;">
                <input type="text" id="gRange_${i}" value="${g.range}" style="flex-grow:1; padding: 4px; border:1px solid #cbd5e1; border-radius:4px;">
                <input type="number" id="gPoint_${i}" value="${g.point}" step="0.25" style="width: 60px; padding: 4px; border:1px solid #cbd5e1; border-radius:4px;">
                <button class="btn btn-danger" style="padding:3px 6px; font-size:11px;" onclick="removeGrade(${i})">❌</button>
                <button class="btn btn-primary" style="padding:3px 6px; font-size:11px;" onclick="updateGrade(${i})">💾</button>
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
        const subName = typeof sub === 'string' ? sub : sub.name;
        const isOpt = typeof sub === 'object' && sub.optional;
        container.innerHTML += `
            <div style="display: flex; gap: 8px; margin-bottom: 8px; align-items: center;">
                <span style="font-weight:bold; width:20px;">${i+1}.</span>
                <input type="text" id="subInput_${i}" value="${subName}" style="flex-grow:1; padding:5px; border:1px solid #cbd5e1; border-radius:4px;">
                <label style="font-size:12px; display:flex; align-items:center; gap:3px;">
                    <input type="checkbox" id="subOpt_${i}" ${isOpt ? 'checked' : ''}> ঐচ্ছিক
                </label>
                <button class="btn btn-danger" style="padding:4px 8px; font-size:12px;" onclick="removeSubject(${i})">❌</button>
                <button class="btn btn-primary" style="padding:4px 8px; font-size:12px;" onclick="updateSingleSubject(${i})">💾</button>
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
    const optionalChk = document.getElementById('newSubjectOptional');
    const val = input.value.trim();
    if (!val) return alert('দয়া করে বিষয়ের নাম লিখুন!');
    
    subjectsList.push({ name: val, optional: optionalChk.checked });
    students.forEach(st => st.marks.push(80));
    input.value = '';
    optionalChk.checked = false;
    saveAll();
    renderSubjectManagerList();
    renderAll();
}

function updateSingleSubject(i) {
    const val = document.getElementById(`subInput_${i}`).value.trim();
    const optionalChk = document.getElementById(`subOpt_${i}`).checked;
    if(!val) return alert('বিষয়ের নাম খালি রাখা যাবে না!');
    
    subjectsList[i] = { name: val, optional: optionalChk };
    saveAll();
    renderAll();
    alert('বিষয় আপডেট হয়েছে!');
}

function removeSubject(i) {
    if(subjectsList.length <= 1) return alert('কমপক্ষে একটি বিষয় রাখা আবশ্যক!');
    const subName = typeof subjectsList[i] === 'string' ? subjectsList[i] : subjectsList[i].name;
    if(confirm(`"${subName}" বিষয়টি মুছে ফেলতে চান?`)) {
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
        const subName = typeof sub === 'string' ? sub : sub.name;
        const isOpt = typeof sub === 'object' && sub.optional ? ' (ঐচ্ছিক)' : '';
        const val = studentMarks ? studentMarks[i] : 80;
        container.innerHTML += `
            <div class="form-group">
                <label>${i+1}. ${subName}${isOpt} (100)</label>
                <input type="number" id="modalSub_${i}" min="0" max="100" required value="${val}">
            </div>
        `;
    });
}

function viewMarksheet(index) {
    const st = students[index];
    const rankedList = computeMeritRanks(students);
    const currentStudent = rankedList.find(s => s.originalIndex === index);
    const res = calculateResult(st.marks);

    document.getElementById('mMadrasaName').innerText = headerInfo.madrasaName;
    document.getElementById('mMadrasaAddress').innerText = headerInfo.madrasaAddress;
    document.getElementById('mExamTitle').innerText = headerInfo.examTitle;
    document.getElementById('mClassTitle').innerText = headerInfo.classTitle;

    document.getElementById('mName').innerText = st.name;
    document.getElementById('mDakhila').innerText = st.dakhila;
    document.getElementById('mFather').innerText = st.father || "প্রযোজ্য নয়";
    document.getElementById('mMother').innerText = st.mother || "প্রযোজ্য নয়";
    document.getElementById('mLocation').innerText = st.location || "সখিপুর, টাঙ্গাইল";

    let rowsHtml = '';
    subjectsList.forEach((sub, i) => {
        const subName = typeof sub === 'string' ? sub : sub.name;
        const isOpt = typeof sub === 'object' && sub.optional ? ' (ঐচ্ছিক)' : '';
        const mark = st.marks[i];
        const isFail = mark < 33;
        rowsHtml += `
            <tr>
                <td style="border: 1px solid #15803d; padding: 6px;">${i+1}</td>
                <td style="border: 1px solid #15803d; padding: 6px; text-align: left; padding-left: 10px;">${subName}${isOpt}</td>
                <td style="border: 1px solid #15803d; padding: 6px;">100</td>
                <td style="border: 1px solid #15803d; padding: 6px; font-weight: bold; color: ${isFail ? 'red' : '#000'};">${mark}</td>
                <td style="border: 1px solid #15803d; padding: 6px;">${!res.passed && isFail && !isOpt ? 'রাসিব' : res.grade}</td>
                <td style="border: 1px solid #15803d; padding: 6px;">${!res.passed && isFail && !isOpt ? '0.00' : res.point}</td>
            </tr>
        `;
    });

    document.getElementById('mSubjectsTableBody').innerHTML = rowsHtml;
    document.getElementById('mTotalMaxMarks').innerText = res.maxTotal;
    document.getElementById('mTotalObtained').innerText = res.total;
    document.getElementById('mFinalGradePoint').innerText = `${res.grade} (${res.point})`;
    
    let meritText = '-';
    if (currentStudent && currentStudent.passed) {
        const rank = currentStudent.merit;
        if (rank === 1) meritText = "1st";
        else if (rank === 2) meritText = "2nd";
        else if (rank === 3) meritText = "3rd";
        else meritText = `${rank}th`;
    }

    const passStatusEl = document.getElementById('mPassStatus');
    passStatusEl.innerText = res.passed ? "উত্তীর্ণ" : "অনুত্তীর্ণ (ফেল)";
    passStatusEl.style.color = res.passed ? "#15803d" : "#dc2626";
    
    document.getElementById('mMeritRank').innerText = meritText;

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
        isWifaqMode = false;
        subjectsList = JSON.parse(JSON.stringify(defaultSubjects));
        gradesList = [...defaultGrades];
        students = JSON.parse(JSON.stringify(defaultStudents));
        headerInfo = { ...defaultHeaderInfo };
        renderAll();
    }
}

renderAll();