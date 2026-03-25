let users = [{u:"user",p:"123",r:"candidate"},{u:"hr",p:"123",r:"recruiter"}];
let jobs = [];
let apps = [];
let currentJobIndex = null;
let currentViewAppIndex = null;
let currentUser = null;
let currentRole = null;
let currentFilter = 'all';
 
// ---- NAVIGATION ----
function showPage(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");
    const navRight = document.getElementById("navRight");
    if (id === 'candidatePage' || id === 'recruiterPage') {
        navRight.innerHTML = `
            <span class="nav-badge">${currentUser} · ${currentRole}</span>
            <button class="btn btn-outline btn-sm" onclick="logout()">Sign Out</button>
        `;
    } else { navRight.innerHTML = ""; }
}
 
function toggleAdminField() {
    document.getElementById("adminArea").style.display = document.getElementById("newRole").value === 'recruiter' ? 'block' : 'none';
}
 
// ---- AUTH ----
function login() {
    let u = document.getElementById("loginUser").value.trim();
    let p = document.getElementById("loginPass").value;
    let r = document.getElementById("loginRole").value;
    if (!u || !p) return showToast("Please enter your credentials", "error");
    let user = users.find(x => x.u === u && x.p === p && x.r === r);
    if (!user) return showToast("Invalid credentials. Please check your username, password and role.", "error");
    currentUser = u; currentRole = r;
    if (r === 'candidate') {
        showPage('candidatePage');
        renderJobs(); renderMyApps();
    } else {
        showPage('recruiterPage');
        renderApps();
    }
}
 
function register() {
    let role = document.getElementById("newRole").value;
    let u = document.getElementById("newUser").value.trim();
    let p = document.getElementById("newPass").value;
    if (!u || !p) return showToast("Username and password are required.", "error");
    if (users.find(x => x.u === u)) return showToast("Username already taken. Choose another.", "error");
    if (role === 'recruiter' && document.getElementById("adminCode").value !== 'ADMIN123')
        return showToast("Invalid recruiter access code.", "error");
    users.push({u, p, r: role});
    showToast("Account created! You can now log in.", "success");
    showPage('loginPage');
}
 
function logout() { currentUser = null; currentRole = null; showPage('logoutPage'); }
 
// ---- JOB MANAGEMENT ----
function postJob() {
    let title = document.getElementById("jTitle").value.trim();
    let company = document.getElementById("jCompany").value.trim();
    if (!title || !company) return showToast("Job title and company are required.", "error");
    jobs.push({
        title, company,
        salary: document.getElementById("jSalary").value,
        location: document.getElementById("jLocation").value || "Not specified",
        type: document.getElementById("jType").value,
        skills: document.getElementById("jSkills").value.toLowerCase(),
        desc: document.getElementById("jDesc").value,
        postedAt: new Date().toLocaleDateString()
    });
    document.getElementById("jTitle").value = "";
    document.getElementById("jCompany").value = "";
    document.getElementById("jSalary").value = "";
    document.getElementById("jLocation").value = "";
    document.getElementById("jSkills").value = "";
    document.getElementById("jDesc").value = "";
    showToast("Job posting published successfully!", "success");
    renderJobs();
}
 
function renderJobs() {
    const list = document.getElementById("jobsList");
    const cnt = document.getElementById("jobCount");
    if (jobs.length === 0) {
        list.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="e-icon">📭</div><p>No job postings yet. Check back soon!</p></div>`;
        cnt.textContent = '';
        return;
    }
    cnt.textContent = `${jobs.length} position${jobs.length > 1 ? 's' : ''} available`;
    list.innerHTML = jobs.map((j, i) => {
        const skillsArr = j.skills.split(",").map(s => s.trim()).filter(Boolean);
        const userApplied = apps.find(a => a.jobIndex === i && a.candidate === currentUser);
        return `
            <div class="job-card" onclick="${userApplied ? '' : `openApply(${i})`}" style="${userApplied ? 'cursor:default;opacity:0.7;' : ''}">
                ${userApplied ? `<div style="position:absolute;top:14px;right:14px;"><span class="status-pill status-${userApplied.status}">Applied</span></div>` : ''}
                <div class="job-title">${j.title}</div>
                <div class="job-company">${j.company}</div>
                ${j.desc ? `<p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:10px;">${j.desc.substring(0,90)}${j.desc.length > 90 ? '…' : ''}</p>` : ''}
                <div class="job-salary">${j.salary}</div>
                <div class="job-skills">
                    ${skillsArr.slice(0,5).map(s => `<span class="skill-chip">${s}</span>`).join('')}
                </div>
                <div class="job-meta">
                    <span class="job-badge">📍 ${j.location}</span>
                    <span class="job-badge">⏱ ${j.type}</span>
                    ${!userApplied ? `<button class="btn btn-primary btn-sm" style="margin-left:auto;" onclick="event.stopPropagation();openApply(${i})">Apply Now</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}
 
// ---- APPLY ----
function openApply(i) {
    currentJobIndex = i;
    const j = jobs[i];
    document.getElementById("applyModalTitle").textContent = `Apply for ${j.title}`;
    document.getElementById("applyModalCompany").textContent = `${j.company} · ${j.location} · ${j.type}`;
    document.getElementById("applyModal").style.display = "flex";
}
 
function submitApp() {
    let name = document.getElementById("appFull").value.trim();
    let email = document.getElementById("appMail").value.trim();
    let text = document.getElementById("appText").value.trim();
    let exp = document.getElementById("appExperience").value;
    if (!name || !email || !text || !exp) return showToast("Please fill in all required fields (*).", "error");
    if (!/\S+@\S+\.\S+/.test(email)) return showToast("Please enter a valid email address.", "error");
 
    let job = jobs[currentJobIndex];
    let skills = job.skills.split(",").map(s => s.trim()).filter(Boolean);
    let matches = skills.filter(s => s && text.toLowerCase().includes(s));
    const anchors = ["experience", "education", "skills", "projects", "employment", "work", "developed", "managed", "led", "built"];
    let anchorPoints = anchors.filter(a => text.toLowerCase().includes(a)).length;
    let score = skills.length > 0 ? Math.floor((matches.length / skills.length) * 75) + (anchorPoints * 3) : anchorPoints * 5;
    score = Math.min(100, score);
 
    // Read file
    const fileInput = document.getElementById("appFile");
    const file = fileInput.files[0] ? fileInput.files[0] : null;
    let fileDataUrl = null;
    const finalize = () => {
        apps.push({
            name, email, text, score,
            job: job.title, company: job.company,
            jobIndex: currentJobIndex,
            exp, exp,
            linkedin: document.getElementById("appLinkedin").value,
            url: document.getElementById("appUrl").value,
            matchedSkills: matches,
            status: 'pending',
            candidate: currentUser,
            appliedAt: new Date().toLocaleDateString(),
            fileName: file ? file.name : null,
            fileData: fileDataUrl
        });
        showToast("Application submitted! The recruiter will review it shortly.", "success");
        closeModal('applyModal');
        document.getElementById("appFull").value = "";
        document.getElementById("appMail").value = "";
        document.getElementById("appText").value = "";
        document.getElementById("appExperience").value = "";
        document.getElementById("appLinkedin").value = "";
        document.getElementById("appUrl").value = "";
        document.getElementById("appFile").value = "";
        renderJobs(); renderMyApps();
    };
    if (file) {
        const reader = new FileReader();
        reader.onload = e => { fileDataUrl = e.target.result; finalize(); };
        reader.readAsDataURL(file);
    } else { finalize(); }
}
 
// ---- MY APPS (CANDIDATE) ----
function renderMyApps() {
    const section = document.getElementById("myAppsSection");
    const myApps = apps.filter(a => a.candidate === currentUser);
    if (myApps.length === 0) { section.style.display = 'none'; return; }
    section.style.display = 'block';
 
    // Notifications
    const notifs = myApps.filter(a => a.status !== 'pending');
    const notifArea = document.getElementById("notificationsArea");
    notifArea.innerHTML = notifs.map(a => {
        if (a.status === 'accepted') {
            return `<div class="notification-banner notif-accept">
                <div class="notif-icon">🎉</div>
                <div><strong>Congratulations!</strong> Your application for <strong>${a.job}</strong> at <strong>${a.company}</strong> has been <strong>accepted</strong>!
                <br><span style="font-size:0.82rem;opacity:0.85;">The recruiter will contact you by <strong>${a.contactBy || 'N/A'}</strong>. Please check your email at <strong>${a.email}</strong>.</span></div>
            </div>`;
        } else if (a.status === 'rejected') {
            return `<div class="notification-banner notif-reject">
                <div class="notif-icon">❌</div>
                <div><strong>Application Update:</strong> Your application for <strong>${a.job}</strong> at <strong>${a.company}</strong> was not selected.
                ${a.rejectReason ? `<br><span style="font-size:0.82rem;opacity:0.85;">Reason: ${a.rejectReason}</span>` : ''}</div>
            </div>`;
        }
    }).join('');
 
    document.getElementById("myAppsList").innerHTML = myApps.map((a, gi) => {
        const realIdx = apps.indexOf(a);
        const steps = getSteps(a.status);
        return `<div class="app-status-card" style="flex-direction:column;align-items:stretch;gap:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <h4>${a.job} — ${a.company}</h4>
                    <span>Applied on ${a.appliedAt} · Match Score: ${a.score}%</span>
                </div>
                <span class="status-pill status-${a.status}">${capitalize(a.status)}</span>
            </div>
            <div class="stepper">
                ${steps.map((s,si) => `
                    <div class="step ${s.state}">
                        <div class="step-circle">${s.state === 'done' ? '✓' : si+1}</div>
                        <div class="step-label">${s.label}</div>
                    </div>
                    ${si < steps.length-1 ? `<div class="step-line ${s.state === 'done' ? 'done' : ''}"></div>` : ''}
                `).join('')}
            </div>
        </div>`;
    }).join('');
}
 
function getSteps(status) {
    const all = [
        {label:'Applied'}, {label:'Under Review'}, {label:'Decision'}
    ];
    if (status === 'pending') return all.map((s,i) => ({...s, state: i === 0 ? 'done' : i === 1 ? 'active' : ''}));
    if (status === 'accepted') return all.map((s,i) => ({...s, state: 'done'}));
    if (status === 'rejected') return [{label:'Applied',state:'done'},{label:'Reviewed',state:'done'},{label:'Not Selected',state:'active'}];
    return all.map(s => ({...s, state:''}));
}
 
// ---- RECRUITER APPS ----
function filterApps(filter, btn) {
    currentFilter = filter;
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderApps();
}
 
function renderApps() {
    const list = document.getElementById("appsList");
    if (!list) return;
    let filtered = currentFilter === 'all' ? apps : apps.filter(a => a.status === currentFilter);
    let sorted = [...filtered].sort((a,b) => b.score - a.score);
    if (sorted.length === 0) {
        list.innerHTML = `<div class="empty-state"><div class="e-icon">📋</div><p>No applicants in this category yet.</p></div>`;
        return;
    }
    list.innerHTML = sorted.map((a) => {
        const realIdx = apps.indexOf(a);
        const pillClass = a.score > 70 ? 'match-high' : 'match-mid';
        const statusBadge = a.status !== 'pending' ? `<span class="status-pill status-${a.status}" style="font-size:0.7rem;">${capitalize(a.status)}</span>` : '';
        return `<div class="applicant-row" onclick="viewApplicant(${realIdx})">
            <div>
                <div class="app-name">${a.name} ${statusBadge}</div>
                <div class="app-job-sub">${a.job} · ${a.company} · Applied ${a.appliedAt}</div>
            </div>
            <span class="match-pill ${pillClass}">${a.score}%</span>
        </div>`;
    }).join('');
}
 
function viewApplicant(i) {
    currentViewAppIndex = i;
    let a = apps[i];
    document.getElementById("vName").textContent = a.name;
    document.getElementById("vJobTitle").textContent = `${a.job} — ${a.company}`;
    document.getElementById("vEmail").textContent = a.email;
    document.getElementById("vExp").textContent = a.exp + (a.exp == 1 ? ' Year' : ' Years');
    document.getElementById("vText").textContent = a.text;
 
    // LinkedIn
    const liEl = document.getElementById("vLinkedin");
    liEl.innerHTML = a.linkedin ? `<a href="https://${a.linkedin.replace(/^https?:\/\//,'')}" target="_blank">${a.linkedin}</a>` : '<span style="color:var(--text-muted)">Not provided</span>';
    // URL
    const urlEl = document.getElementById("vUrl");
    urlEl.innerHTML = a.url ? `<a href="${a.url}" target="_blank">${a.url}</a>` : '<span style="color:var(--text-muted)">Not provided</span>';
 
    // Resume PDF link
    const resumeEl = document.getElementById("vResumeLink");
    if (a.fileData) {
        resumeEl.innerHTML = `<a href="${a.fileData}" download="${a.fileName}" class="btn btn-outline btn-sm" style="display:inline-flex;">📄 Download ${a.fileName}</a>`;
    } else {
        resumeEl.innerHTML = `<span style="color:var(--text-muted);font-size:0.85rem;">No PDF uploaded</span>`;
    }
 
    // Matched skills
    const msEl = document.getElementById("vMatchedSkills");
    msEl.innerHTML = a.matchedSkills && a.matchedSkills.length > 0
        ? a.matchedSkills.map(s => `<span class="skill-chip">${s}</span>`).join('')
        : `<span style="color:var(--text-muted);font-size:0.82rem;">No direct skill matches found</span>`;
 
    document.getElementById("vScore").textContent = `AI Match Score: ${a.score}% · Applied on ${a.appliedAt}`;
 
    // Status badge
    const sbEl = document.getElementById("vStatusBadge");
    if (a.status === 'accepted') sbEl.innerHTML = `<span class="badge-accepted">✓ Accepted</span>`;
    else if (a.status === 'rejected') sbEl.innerHTML = `<span class="badge-rejected">✗ Rejected</span>`;
    else sbEl.innerHTML = `<span class="status-pill status-pending">Pending Review</span>`;
 
    // Decision area
    renderDecisionArea(a);
    document.getElementById("viewModal").style.display = "flex";
}
 
function renderDecisionArea(a) {
    const dc = document.getElementById("decisionContent");
    if (a.status === 'accepted') {
        dc.innerHTML = `
            <div style="background:var(--success-bg);border:1px solid rgba(34,211,165,0.3);border-radius:8px;padding:14px;font-size:0.88rem;">
                ✅ <strong>Application Accepted</strong><br>
                <span style="color:var(--text-muted);">Candidate contact deadline: <strong>${a.contactBy || 'N/A'}</strong></span>
            </div>`;
    } else if (a.status === 'rejected') {
        dc.innerHTML = `
            <div style="background:var(--error-bg);border:1px solid rgba(244,63,94,0.3);border-radius:8px;padding:14px;font-size:0.88rem;">
                ❌ <strong>Application Rejected</strong><br>
                ${a.rejectReason ? `<span style="color:var(--text-muted);">Reason: ${a.rejectReason}</span>` : ''}
            </div>`;
    } else {
        dc.innerHTML = `
            <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:14px;">Make a decision on this application:</p>
            <div class="decision-row">
                <button class="btn btn-success" onclick="openAccept()" style="flex:1;justify-content:center;">✓ Accept</button>
                <button class="btn btn-danger" onclick="openReject()" style="flex:1;justify-content:center;">✗ Reject</button>
            </div>
            <div id="acceptTimeForm" class="accept-time" style="display:none;margin-top:14px;">
                <label>Contact Candidate By (Date)</label>
                <input type="date" id="contactByDate" style="margin-top:6px;">
                <button class="btn btn-success btn-sm" style="margin-top:10px;width:100%;justify-content:center;" onclick="confirmAccept()">Confirm Acceptance</button>
            </div>`;
    }
}
 
function openAccept() {
    const form = document.getElementById("acceptTimeForm");
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
    const today = new Date();
    today.setDate(today.getDate() + 7);
    document.getElementById("contactByDate").valueAsDate = today;
}
 
function confirmAccept() {
    const contactBy = document.getElementById("contactByDate").value;
    if (!contactBy) return showToast("Please select a contact date.", "error");
    const formatted = new Date(contactBy).toLocaleDateString('en-IN', {day:'numeric',month:'long',year:'numeric'});
    apps[currentViewAppIndex].status = 'accepted';
    apps[currentViewAppIndex].contactBy = formatted;
    showToast(`✅ Application accepted! Candidate notified via ${apps[currentViewAppIndex].email}`, "success");
    renderApps();
    viewApplicant(currentViewAppIndex);
}
 
function openReject() { document.getElementById("rejectModal").style.display = "flex"; }
 
function toggleCustomReason() {
    document.getElementById("customReasonArea").style.display =
        document.getElementById("rejectReason").value === 'custom' ? 'block' : 'none';
}
 
function confirmReject() {
    let reason = document.getElementById("rejectReason").value;
    if (!reason) return showToast("Please select a rejection reason.", "error");
    if (reason === 'custom') {
        reason = document.getElementById("customReason").value.trim();
        if (!reason) return showToast("Please enter your custom reason.", "error");
    }
    apps[currentViewAppIndex].status = 'rejected';
    apps[currentViewAppIndex].rejectReason = reason;
    showToast(`Application rejected. Candidate has been notified via ${apps[currentViewAppIndex].email}`, "error");
    closeModal('rejectModal');
    document.getElementById("rejectReason").value = "";
    document.getElementById("customReason").value = "";
    document.getElementById("customReasonArea").style.display = 'none';
    renderApps();
    viewApplicant(currentViewAppIndex);
}
 
// ---- UTILS ----
function closeModal(id) { document.getElementById(id).style.display = "none"; }
 
function showToast(msg, type = 'success') {
    const container = document.getElementById("toast");
    const t = document.createElement("div");
    t.className = `toast-item toast-${type}`;
    t.textContent = msg;
    container.appendChild(t);
    setTimeout(() => { t.style.opacity='0'; t.style.transition='opacity 0.4s'; setTimeout(() => t.remove(), 400); }, 3500);
}
 
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
 
// Close modals on backdrop click
document.querySelectorAll(".modal").forEach(m => {
    m.addEventListener("click", e => { if (e.target === m) closeModal(m.id); });
});
 
// Seed some sample jobs on load
jobs.push(
    {title:"Senior Frontend Developer", company:"TechNova India", salary:"₹15–22 LPA", location:"Hyderabad / Remote", type:"Full-Time", skills:"react,typescript,css,html,next.js", desc:"Build world-class web interfaces for our SaaS platform.", postedAt: new Date().toLocaleDateString()},
    {title:"Data Analyst", company:"Insight Corp", salary:"₹8–14 LPA", location:"Bangalore", type:"Full-Time", skills:"python,sql,tableau,excel,pandas", desc:"Analyze large datasets and drive business decisions.", postedAt: new Date().toLocaleDateString()},
    {title:"Backend Engineer", company:"CloudBase", salary:"₹12–18 LPA", location:"Remote", type:"Contract", skills:"node.js,postgresql,docker,aws,rest api", desc:"Design and maintain robust backend services.", postedAt: new Date().toLocaleDateString()}
);
renderJobs();
