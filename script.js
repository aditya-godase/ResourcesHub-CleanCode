let resources = [];
const API_URL = "https://resourceshub-backend.onrender.com/api/resources";

const subjectsBySem = {
    '1': ['DBMS', 'C Programming', 'Python', 'OE', 'English'],
    '2': ['Electronics', 'Mathematics', 'RDBMS', 'Advance C Programming', 'Software Engineering', 'Data Science'],
    '3': ['Web Dev', 'Operating Systems', 'Java']
};

let currentCategoryFilter = 'all';

function toggleMobileMenu() {
    document.body.classList.toggle('mobile-nav-open');
}

async function fetchResources() {
    const grid = document.getElementById('resourceGrid');

    try {
        if (grid) {
            grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding: 4rem;">
                <i class="fas fa-spinner fa-spin" style="font-size:2rem; color: var(--primary);"></i>
                <p style="margin-top:1rem; color: var(--text-gray);">Loading library...</p>
            </div>`;
        }

        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch data');

        resources = await response.json();

        if (grid) {
            updateSubjects();
            filterResources();
        }
    } catch (error) {
        console.error("Error loading resources:", error);
        if (grid) {
            grid.innerHTML = `
                <div style="grid-column:1/-1; text-align:center; padding: 4rem; color:#EF4444;">
                    <i class="fas fa-exclamation-circle" style="font-size:2rem; margin-bottom:1rem;"></i>
                    <p>Failed to connect to the server.<br>Please try again later.</p>
                    <button type="button" onclick="window.location.reload();" class="btn-secondary">Refresh Page</button>
                </div>`;
        }
    }
}

if (document.getElementById('resourceGrid')) {
    window.addEventListener('DOMContentLoaded', fetchResources);

    window.updateSubjects = function () {
        const semSelect = document.getElementById('semFilter');
        const subjectSelect = document.getElementById('subjectFilter');

        if (!semSelect || !subjectSelect) return;

        const selectedSem = semSelect.value;
        subjectSelect.innerHTML = '<option value="all">All Subjects</option>';

        let subjectsToShow = [];
        if (selectedSem === 'all') {
            const allSubs = Object.values(subjectsBySem).flat();
            subjectsToShow = [...new Set(allSubs)];
        } else if (subjectsBySem[selectedSem]) {
            subjectsToShow = subjectsBySem[selectedSem];
        }

        subjectsToShow.forEach(sub => {
            const option = document.createElement('option');
            option.value = sub;
            option.textContent = sub;
            subjectSelect.appendChild(option);
        });
        filterResources();
    }

    window.setCategory = function (category, btnElement) {
        document.querySelectorAll('.pill').forEach(btn => btn.classList.remove('active'));
        btnElement.classList.add('active');
        currentCategoryFilter = category;
        filterResources();
    }

    window.hideElement = function () {
        const element = document.getElementById("codeAction");
        if (element) element.style.display = "none";
        document.body.style.overflow = 'auto';
    }

    window.showElement = function () {
        const element = document.getElementById("codeAction");
        if (element) element.style.display = "flex";
        document.body.style.overflow = 'hidden';
    }

    function getExtension(tag) {
        const t = tag.toLowerCase();
        if (t.includes('c++') || t.includes('electronics') || t.includes('c programming')) return '.cpp';
        if (t.includes('python')) return '.py';
        if (t.includes('java') && !t.includes('script')) return '.java';
        if (t.includes('sql')) return '.sql';
        if (t.includes('html')) return '.html';
        if (t.includes('css')) return '.css';
        return '.txt';
    }


    window.showToast = function (message, type = 'info') {
        const toast = document.getElementById("toast");
        const msgSpan = document.getElementById("toastMsg");
        const icon = toast.querySelector('i');

        msgSpan.innerText = message;

        if (type === 'success') {
            icon.className = 'fas fa-check-circle';
            icon.style.color = '#10B981';
        } else {
            icon.className = 'fas fa-info-circle';
            icon.style.color = '#4F46E5';
        }

        toast.classList.add("show");

        setTimeout(function () {
            toast.classList.remove("show");
        }, 3000);
    }

    function triggerButtonFeedback(btnElement) {
        if (btnElement.dataset.isAnimating) return;

        const originalHTML = btnElement.innerHTML;
        btnElement.style.width = getComputedStyle(btnElement).width;
        btnElement.innerHTML = '<i class="fas fa-check" style="color: #10B981;"></i>';
        btnElement.dataset.isAnimating = "true";

        setTimeout(() => {
            btnElement.innerHTML = originalHTML;
            btnElement.style.width = '';
            delete btnElement.dataset.isAnimating;
        }, 2000);
    }

    window.handleCopy = function (btnElement, targetId) {
        const codeBlock = document.getElementById(targetId);
        if (!codeBlock) return console.error(`Target ID ${targetId} not found`);

        navigator.clipboard.writeText(codeBlock.innerText).then(() => {
            triggerButtonFeedback(btnElement);
            showToast("Code copied to clipboard!", 'success');
        }).catch(err => {
            console.error('Copy failed', err);
            showToast("Failed to copy code", 'error');
        });
    }

    window.handleDownload = function (btnElement, targetId) {
        const codeBlock = document.getElementById(targetId);
        if (!codeBlock) return;

        const codeText = codeBlock.innerText;
        const filename = btnElement.getAttribute('data-filename') || 'snippet.txt';

        const blob = new Blob([codeText], {
            type: 'text/plain'
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');

        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        triggerButtonFeedback(btnElement);
        showToast(`Downloading ${filename}...`, 'success');
    }

    window.loadCodeToSidebar = function (id) {
        const item = resources.find(r => String(r.id) === String(id));
        if (!item) return;

        const sourceCode = item.source || "// No code available for this item.";
        const highlighted = highlightCode(sourceCode, item.tag);

        const safeTitle = item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const ext = getExtension(item.tag);
        const fullFilename = `${safeTitle}${ext}`;

        const mobileCodeBlock = document.getElementById('mobileCodeBlock');
        const mobileTitle = document.getElementById('mobileWidgetTitle');
        const mobileBtn = document.getElementById('mobileDownloadBtn');

        if (mobileTitle) mobileTitle.innerHTML = `<i class="fas fa-code text-yellow"></i> ${item.title}`;
        if (mobileCodeBlock) mobileCodeBlock.innerHTML = highlighted;
        if (mobileBtn) mobileBtn.setAttribute('data-filename', fullFilename);

        const deskCodeBlock = document.getElementById('sidebarCodeBlock');
        const deskTitle = document.getElementById('widgetTitle');
        const deskBtn = document.getElementById('desktopDownloadBtn');

        if (deskTitle) deskTitle.innerHTML = `<i class="fas fa-code text-yellow"></i> ${item.title.substring(0, 20)}...`;
        if (deskCodeBlock) deskCodeBlock.innerHTML = highlighted;
        if (deskBtn) deskBtn.setAttribute('data-filename', fullFilename);

        if (window.innerWidth < 768) {
            showElement();
        }
    }

    window.filterResources = function () {
        const grid = document.getElementById('resourceGrid');
        const searchInput = document.getElementById('searchInput');
        const semFilter = document.getElementById('semFilter');
        const subjectFilter = document.getElementById('subjectFilter');

        if (!grid) return;

        const search = searchInput ? searchInput.value.toLowerCase() : '';
        const sem = semFilter ? semFilter.value : 'all';
        const subject = subjectFilter ? subjectFilter.value : 'all';

        grid.innerHTML = '';

        const filtered = resources.filter(item => {
            const matchSearch = item.title.toLowerCase().includes(search) || item.tag.toLowerCase().includes(search);
            const matchSem = sem === 'all' || String(item.sem) === String(sem);
            const matchSubject = subject === 'all' || item.subject === subject;

            let matchPill = false;
            if (currentCategoryFilter === 'all') matchPill = true;
            else if (['Book', 'Paper'].includes(currentCategoryFilter)) matchPill = item.type === currentCategoryFilter;
            else matchPill = item.tag.includes(currentCategoryFilter);

            return matchSearch && matchSem && matchSubject && matchPill;
        });

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div style="grid-column:1/-1; text-align:center; padding: 4rem; color:#6B7280;">
                    <i class="fas fa-search" style="font-size:2rem; margin-bottom:1rem; opacity:0.5;"></i>
                    <p>No resources found for this criteria.</p>
                </div>`;
            return;
        }

        filtered.forEach(item => {
            let actionButton = '';
            let iconClass = 'fa-file-alt';
            let iconColor = 'bg-gray';
            if (item.type === 'Code') {
                actionButton = `<button onclick="loadCodeToSidebar('${item.id}')" class="btn-small">View Code</button>`;
                iconClass = 'fa-code';
                iconColor = 'bg-teal';
            } else if (item.type === 'Book') {
                actionButton = `<button onclick="downloadPDF('${item.source}', '${item.title}')" class="btn-small">Download PDF</button>`;
                iconClass = 'fa-book';
                iconColor = 'bg-red';
            } else {
                actionButton = `<button onclick="downloadPDF('${item.source}', '${item.title}')" class="btn-small">Download Paper</button>`;
                iconClass = 'fa-file-contract';
                iconColor = 'bg-orange';
            }

            const html = `
                <div class="card" id="card-${item.id}">
                    <div class="card-top">
                        <div class="card-icon ${iconColor}">
                            <i class="fas ${iconClass}"></i>
                        </div>
                        <span class="tag" style="font-size:0.75rem; font-weight:600; color:#6B7280; background:#F3F4F6; padding:4px 8px; border-radius:6px;">${item.tag}</span>
                    </div>
                    <h4>${item.title}</h4>
                    <div class="meta-info">
                        <span><i class="fas fa-layer-group"></i> Sem ${item.sem}</span>
                        <span>•</span>
                        <span>${item.subject}</span>
                    </div>
                    ${actionButton}
                </div>
            `;
            grid.innerHTML += html;
        });
    }

    function highlightCode(code, tag) {
        if (!code) return '';

        code = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        const t = tag.toLowerCase();

        const span = (text, cls) => `<span class="${cls}">${text}</span>`;


        if (t.includes('sql') || t.includes('dbms')) {
            code = code.replace(/('.*?')|(--.*$)/gm, (match, str, cmt) => {
                if (str) return span(str, 'str');
                if (cmt) return span(cmt, 'cmt');
                return match;
            });

            const keywords = /\b(SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|DELETE|CREATE|DROP|ALTER|TABLE|INDEX|VIEW|JOIN|INNER|OUTER|LEFT|RIGHT|ON|GROUP|BY|ORDER|HAVING|LIMIT|OFFSET|UNION|ALL|DISTINCT|AS|AND|OR|NOT|NULL|PRIMARY|KEY|FOREIGN|REFERENCES|DEFAULT|CHECK|CONSTRAINT|BEGIN|COMMIT|ROLLBACK|TRANSACTION|GRANT|REVOKE)\b/gi;
            code = code.replace(keywords, match => span(match, 'kwd'));
        }

        else if (t.includes('python')) {
            code = code.replace(/(".*?")|('.*?')|(#.*$)/gm, (match, str1, str2, cmt) => {
                if (str1 || str2) return span(match, 'str');
                if (cmt) return span(cmt, 'cmt');
                return match;
            });

            const keywords = /\b(def|class|if|elif|else|while|for|in|try|except|finally|with|as|import|from|return|pass|break|continue|lambda|yield|global|nonlocal|assert|del|or|and|not|is|None|True|False|self|print|len|range|open|str|int|float|list|dict|set|super)\b/g;
            code = code.replace(keywords, match => span(match, 'kwd'));
        }

        else if (t.includes('java') && !t.includes('script')) {
            code = code.replace(/(".*?")|(\/\/.*$)/gm, (match, str, cmt) => {
                if (str) return span(str, 'str');
                if (cmt) return span(cmt, 'cmt');
                return match;
            });

            const keywords = /\b(public|private|protected|static|final|void|int|double|float|char|boolean|byte|short|long|class|interface|enum|extends|implements|new|this|super|return|if|else|switch|case|default|while|do|for|break|continue|try|catch|finally|throw|throws|package|import|null|true|false|abstract|synchronized|volatile|transient|native)\b/g;
            code = code.replace(keywords, match => span(match, 'kwd'));
        }

        else if (t.includes('c++') || t.includes('c programming') || t.includes('arduino') || t.includes('electronics')) {
            code = code.replace(/(".*?")|(\/\/.*$)|(#.*$)/gm, (match, str, cmt1, preproc) => {
                if (str) return span(str, 'str');
                if (cmt1) return span(cmt1, 'cmt');
                if (preproc) return span(preproc, 'kwd');
                return match;
            });

            const keywords = /\b(int|float|double|char|void|long|short|unsigned|signed|const|static|volatile|if|else|switch|case|default|while|do|for|break|continue|return|goto|typedef|struct|union|enum|class|public|private|protected|virtual|friend|this|new|delete|namespace|using|template|typename|try|catch|throw|sizeof|true|false|bool|nullptr)\b/g;
            code = code.replace(keywords, match => span(match, 'kwd'));
        }

        else if (t.includes('html')) {
            code = code.replace(/(&lt;!--.*?--&gt;)/gs, match => span(match, 'cmt'));

            code = code.replace(/(&lt;\/?)([a-z0-9]+)(.*?)?(&gt;)/gi, (match, bracket, tagName, attrs, end) => {
                return `${bracket}${span(tagName, 'kwd')}${attrs}${end}`;
            });

            code = code.replace(/\s([a-z0-9-]+)=/gi, (match, attr) => {
                return ` <span class="str">${attr}</span>=`;
            });
        }

        else if (t.includes('css')) {
            code = code.replace(/(\/\*[\s\S]*?\*\/)/g, match => span(match, 'cmt'));

            code = code.replace(/([\w-]+)\s*:/g, (match, prop) => {
                return `${span(prop, 'kwd')}:`;
            });
        }

        else {
            code = code.replace(/(".*?")|('.*?')|(`[\s\S]*?`)|(\/\/.*$)/gm, (match, s1, s2, s3, cmt) => {
                if (s1 || s2 || s3) return span(match, 'str');
                if (cmt) return span(cmt, 'cmt');
                return match;
            });

            const keywords = /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|new|this|class|extends|super|import|export|from|default|async|await|typeof|instanceof|void|delete|in|of|null|undefined|true|false|NaN|console|window|document|Math|JSON)\b/g;
            code = code.replace(keywords, match => span(match, 'kwd'));
        }

        return code;
    }

    const urlParams = new URLSearchParams(window.location.search);

    const query = urlParams.get('q');
    if (query) {
        document.getElementById('searchInput').value = query;
    }

    const semParam = urlParams.get('sem');
    if (semParam) {
        const semSelect = document.getElementById('semFilter');
        if (semSelect) {
            semSelect.value = semParam;
            if (typeof window.updateSubjects === 'function') {
                window.updateSubjects();
            }
        }
    }

    const catParam = urlParams.get('cat');
    if (catParam) {
        currentCategoryFilter = catParam;

        setTimeout(() => {
            document.querySelectorAll('.pill').forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('onclick').includes(`'${catParam}'`) || btn.innerText === catParam) {
                    btn.classList.add('active');
                }
            });
        }, 100);
    }
}

window.performHomeSearch = function () {
    const input = document.getElementById('homeSearchInput');
    if (input && input.value.trim() !== "") {
        window.location.href = `resources.html?q=${encodeURIComponent(input.value)}`;
    }
}

if (document.getElementById('dropZone')) {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#4F46E5';
        dropZone.style.background = '#EEF2FF';
    });

    dropZone.addEventListener('dragleave', (e) => {
        dropZone.style.borderColor = '#E5E7EB';
        dropZone.style.background = '#F9FAFB';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#10B981';
        dropZone.style.background = '#ECFDF5';
    });

    window.handleUpload = function (e) {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        const originalText = btn.innerHTML;
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Uploading...`;
        btn.style.opacity = "0.8";

        setTimeout(() => {
            alert("Thanks for contributing! Your resource is under review.");
            btn.innerHTML = originalText;
            btn.style.opacity = "1";
            e.target.reset();
            dropZone.style.background = '#F9FAFB';
            dropZone.style.borderColor = '#E5E7EB';
        }, 1500);
    }
}

async function downloadPDF(url, title) {
    const btn = document.activeElement;
    const originalText = btn ? btn.innerText : 'Download';
    let finalUrl = url;
    if (url.includes('supabase.co')) {
        finalUrl = url.includes('?') ? `${url}&download=` : `${url}?download=`;
    }
    try {
        if (btn) btn.innerText = "Downloading...";
        window.location.href = finalUrl;
        setTimeout(() => {
            if (btn) btn.innerText = 'Saved!';
        }, 2000);
        setTimeout(() => {
            if (btn) btn.innerText = originalText;
        }, 4000);
        showToast("Downloading PDF", 'success');

    } catch (e) {
        console.error("Download error:", e);
        window.open(finalUrl, '_blank');
        if (btn) btn.innerText = originalText;
        showToast("Error: Download Failed", 'failure');
    }
}