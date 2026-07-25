(function() {
    'use strict';

    // =====  F12   =====
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) ||
            (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) ||
            (e.ctrlKey && (e.key === 'U' || e.key === 'u')) ||
            (e.ctrlKey && (e.key === 'S' || e.key === 's'))) {
            e.preventDefault();
            showToast('warning', '    ');
            return false;
        }
    });

    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showToast('warning', '    ');
        return false;
    });

    document.addEventListener('selectstart', function(e) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
        }
    });

    const SUPABASE_URL = 'https://mgcljgrkxhyjjmxqjkti.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_TE4fMQARKZb0XcjhAnEJhA_ws6AUxoi';
    let supabaseClient = null;
    if (window.supabase) {
        if (!window._supabaseClient) {
            window._supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }
        supabaseClient = window._supabaseClient;
    }
    let currentUser = null;
    let data = { sections: [] };
    let isDarkMode = false;
    let isAdminLoggedIn = false;
    let pendingChanges = 0;
    let activeTeacher = null;
    let activeTeacherIndex = null;
    let activeSectionIndex = null;
    let currentFilter = 'all';

    // =====   =====
    const defaultSections = [
        { id: 'first-intermediate', name: ' ', teachers: [] },
        { id: 'second-intermediate', name: ' ', teachers: [] },
        { id: 'third-intermediate', name: ' ', teachers: [] },
        { id: 'fourth-scientific', name: ' ', teachers: [] },
        { id: 'fourth-literary', name: ' ', teachers: [] },
        { id: 'fifth-scientific', name: ' ', teachers: [] },
        { id: 'fifth-literary', name: ' ', teachers: [] },
        { id: 'sixth-scientific', name: ' ', teachers: [] },
        { id: 'sixth-literary', name: ' ', teachers: [] }
    ];

    // =====   -   =====
    let contactMessages = [];

    // ===== DOM Elements =====
    const loadingScreen = document.getElementById('loadingScreen');
    const navbar = document.getElementById('navbar');
    const bottomNav = document.getElementById('bottomNav');
    const footer = document.getElementById('footer');
    const teachersContainer = document.getElementById('teachersContainer');
    const teachersGridContainer = document.getElementById('teachersGridContainer');
    const teachersGridContainer2 = document.getElementById('teachersGridContainer2');
    const sectionFilter = document.getElementById('sectionFilter');
    const sectionFilter2 = document.getElementById('sectionFilter2');
    const teachersCount = document.getElementById('teachersCount');
    const teachersCount2 = document.getElementById('teachersCount2');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const videoPlayer = document.getElementById('videoPlayer');
    const closePlayer = document.getElementById('closePlayer');
    const videoWrapper = document.getElementById('videoWrapper');
    const themeToggle = document.getElementById('themeToggle');
    const toastContainer = document.getElementById('toastContainer');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userAvatar = document.getElementById('userAvatar');

    // ===== Admin Elements =====
    const adminPanel = document.getElementById('adminPanel');
    const adminClose = document.getElementById('adminClose');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const publishBtn = document.getElementById('publishBtn');
    const pendingChangesSpan = document.getElementById('pendingChanges');
    const createTableBtn = document.getElementById('createTableBtn');

    // ===== Forms =====
    const addSectionForm = document.getElementById('addSectionForm');
    const addTeacherForm = document.getElementById('addTeacherForm');
    const addSemesterForm = document.getElementById('addSemesterForm');
    const addLectureForm = document.getElementById('addLectureForm');
    const editTeacherForm = document.getElementById('editTeacherForm');

    // ===== Modals =====
    const teachersModal = document.getElementById('teachersModal');
    const closeTeachersModal = document.getElementById('closeTeachersModal');
    const teachersList = document.getElementById('teachersList');
    const semestersModal = document.getElementById('semestersModal');
    const closeSemestersModal = document.getElementById('closeSemestersModal');
    const semestersList = document.getElementById('semestersList');
    const modalTeacherTitle = document.getElementById('modalTeacherTitle');
    const lecturesModal = document.getElementById('lecturesModal');
    const closeLecturesModal = document.getElementById('closeLecturesModal');
    const lecturesList = document.getElementById('lecturesList');
    const modalSemesterTitle = document.getElementById('modalSemesterTitle');

    // ===== Bottom Navigation =====
    const bottomNavItems = document.querySelectorAll('.bottom-nav .nav-item');

    // ===== Account Page =====
    const accountName = document.getElementById('accountName');
    const accountEmail = document.getElementById('accountEmail');
    const accountAvatar = document.getElementById('accountAvatar');
    const accountRegistered = document.getElementById('accountRegistered');
    const accountCourses = document.getElementById('accountCourses');
    const accountCodes = document.getElementById('accountCodes');
    const accountMessages = document.getElementById('accountMessages');
    const logoutAccountBtn = document.getElementById('logoutAccountBtn');
    const adminPanelBtn = document.getElementById('adminPanelBtn');
    const coursesBadge = document.getElementById('coursesBadge');

    // ===== Edit Lecture =====
    const editLectureModal = document.getElementById('editLectureModal');
    const closeEditLecture = document.getElementById('closeEditLecture');
    const cancelEditLecture = document.getElementById('cancelEditLecture');
    const editLectureForm = document.getElementById('editLectureForm');
    const editLectureTitle = document.getElementById('editLectureTitle');
    const editLectureUrl = document.getElementById('editLectureUrl');
    const editLectureIsFree = document.getElementById('editLectureIsFree');
    const editLectureMessage = document.getElementById('editLectureMessage');

    let editTarget = { sectionIndex: -1, teacherIndex: -1, semesterIndex: -1, lectureIndex: -1 };

    // =====    =====
    const ADMIN_EMAILS = ['sajadsarmd200@gmail.com', 'wisaamhs90@gmail.com', 'zzccvc99@gmail.com'];

    // ============================================================
    //    
    // ============================================================

    function extractVideoUrl(url) {
        if (!url) return '';
        if (url.includes('player.mediadelivery.net/play/')) {
            return url;
        }
        if (url.includes('player.mediadelivery.net/embed/')) {
            return url;
        }
        if (url.includes('mediadelivery.net')) {
            return url;
        }
        if (url.includes('<iframe')) {
            const match = url.match(/src=["']([^"']+)["']/);
            if (match) {
                return match[1];
            }
        }
        return url;
    }

    window.playVideo = function(url, title) {
        if (!url) {
            showToast('error', '    ');
            return;
        }

        let videoUrl = extractVideoUrl(url);

        if (videoUrl.includes('mediadelivery')) {
            if (!videoUrl.includes('autoplay')) {
                const separator = videoUrl.includes('?') ? '&' : '?';
                videoUrl = videoUrl + separator + 'autoplay=true&loop=false&muted=false&preload=true&responsive=true&controls=true';
            } else {
                if (!videoUrl.includes('controls')) {
                    videoUrl = videoUrl + '&controls=true';
                }
            }

            videoUrl = videoUrl.replace(/&?muted=true/g, '');
            videoUrl = videoUrl.replace(/&?muted=false/g, '');

            videoWrapper.innerHTML = `
                <iframe src="${videoUrl}" 
                        loading="lazy" 
                        style="border:0;position:absolute;top:0;left:0;height:100%;width:100%;" 
                        allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;fullscreen;"
                        allowfullscreen="true"
                        webkitallowfullscreen="true"
                        mozallowfullscreen="true">
                </iframe>
            `;

            videoPlayer.classList.add('active');
            document.body.style.overflow = 'hidden';
            showToast('info', ` : ${title || ''}`);
            return;
        }

        const videoId = extractYouTubeId(videoUrl);
        if (videoId) {
            const embedUrl = getYouTubeEmbedUrl(videoId);
            videoWrapper.innerHTML = `
                <iframe src="${embedUrl}" 
                        style="border:0;position:absolute;top:0;left:0;height:100%;width:100%;" 
                        allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture;fullscreen"
                        allowfullscreen>
                </iframe>
            `;

            videoPlayer.classList.add('active');
            document.body.style.overflow = 'hidden';
            showToast('info', ` : ${title || ''}`);
            return;
        }

        if (videoUrl.match(/\.(mp4|webm|ogg|m3u8)(\?.*)?$/i)) {
            videoWrapper.innerHTML = `
                <video controls autoplay 
                       style="position:absolute;top:0;left:0;height:100%;width:100%;background:#000;"
                       controlsList="nodownload"
                       playsinline>
                    <source src="${videoUrl}" type="video/mp4">
                        
                </video>
            `;

            setTimeout(() => {
                const video = videoWrapper.querySelector('video');
                if (video) {
                    video.volume = 1.0;
                    video.muted = false;
                }
            }, 500);

            videoPlayer.classList.add('active');
            document.body.style.overflow = 'hidden';
            showToast('info', ` : ${title || ''}`);
            return;
        }

        showToast('error', '    .   mediadelivery  YouTube');
    };

    function closeVideoPlayer() {
        if (videoWrapper) videoWrapper.innerHTML = '';
        if (videoPlayer) videoPlayer.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    function extractYouTubeId(url) {
        if (!url) return null;
        const patterns = [
            /(?:youtube\.com\/watch\?v=)([^&]+)/,
            /(?:youtu\.be\/)([^?]+)/,
            /(?:youtube\.com\/embed\/)([^?]+)/
        ];
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    }

    function getYouTubeEmbedUrl(videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
    }

    // ============================================================
    // TOAST
    // ============================================================
    function showToast(type, message, duration = 4000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icons = { success: '', error: '', warning: '', info: '' };
        toast.textContent = `${icons[type] || ''} ${message}`;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.4s ease forwards';
            setTimeout(() => toast.remove(), 400);
        }, duration);
    }

    // ===== DEVICE ID =====
    function getDeviceId() {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            deviceId = 'DEV_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('deviceId', deviceId);
        }
        return deviceId;
    }
    const userDeviceId = getDeviceId();

    // ===== ACCESS =====
    function hasAccessToTeacher(teacher) {
        if (!teacher || !teacher.codes) return false;
        if (!currentUser) return false;
        const hasAccess = teacher.codes.some(c => c.used && c.userEmail === currentUser.email && !c.locked);
        return hasAccess;
    }

    // ===== ADMIN VERIFICATION =====
    async function isUserAdmin(email) {
        if (!supabaseClient || !email) {
            return ADMIN_EMAILS.includes(email);
        }
        
        try {
            const { data, error } = await supabaseClient
                .from('admins')
                .select('email')
                .eq('email', email)
                .maybeSingle();
            
            if (error) {
                return ADMIN_EMAILS.includes(email);
            }
            
            return !!data;
        } catch (e) {
            return ADMIN_EMAILS.includes(email);
        }
    }

    // ===== CODE VERIFICATION =====
    async function verifyCode(teacher, code) {
        if (!teacher.codes || teacher.codes.length === 0) {
            return { valid: false, message: '    ' };
        }

        if (!currentUser) {
            return { valid: false, message: '      ' };
        }

        const codeData = teacher.codes.find(c => c.code === code);
        if (!codeData) {
            return { valid: false, message: '   ' };
        }

        if (codeData.locked === true) {
            return { valid: false, message: '      ' };
        }

        if (codeData.used) {
            if (codeData.userEmail === currentUser.email) {
                return { valid: true, message: '    ' };
            } else {
                const usedAt = codeData.usedAt ? new Date(codeData.usedAt).toLocaleString('ar') : '  ';
                return {
                    valid: false,
                    message: `       \n   : ${usedAt}`
                };
            }
        }

        codeData.used = true;
        codeData.deviceId = userDeviceId;
        codeData.userId = currentUser.id;
        codeData.userEmail = currentUser.email;
        codeData.usedAt = new Date().toISOString();
        saveData();

        const syncResult = await syncCodeWithSupabase(teacher, codeData);
        if (!syncResult.success) {
            codeData.used = false;
            codeData.userId = null;
            codeData.userEmail = null;
            codeData.usedAt = null;
            saveData();
            return { valid: false, message: '      ' };
        }

        await addCodeToUserCodes(currentUser.id, codeData.code);
        updateUserCodesStorage();
        renderAllData();
        renderMyCourses();
        renderAccount();
        updateBadge();

        return { valid: true, message: '    -     ' };
    }

    // ===== SYNC CODE WITH SUPABASE =====
    async function syncCodeWithSupabase(teacher, codeData) {
        if (!currentUser || !supabaseClient) {
            return { success: false, error: 'No authenticated user or Supabase unavailable' };
        }
        try {
            const record = {
                code: codeData.code,
                teacher_name: teacher.name,
                user_id: currentUser.id,
                user_email: currentUser.email,
                device_id: userDeviceId,
                used: true,
                locked: codeData.locked || false,
                used_at: codeData.usedAt || new Date().toISOString(),
            };

            const { error } = await supabaseClient.from('teacher_codes').upsert(record, { onConflict: 'code' });
            if (error) {
                return { success: false, error };
            }

            const { error: updateError } = await supabaseClient.from('codes').update({
                is_used: true,
                user_id: currentUser.id,
                user_email: currentUser.email,
                device_id: userDeviceId,
                used_at: new Date().toISOString()
            }).eq('code', codeData.code);

            if (updateError) {
                console.warn('      codes:', updateError);
            }

            return { success: true };
        } catch (error) {
            return { success: false, error };
        }
    }

    // ===== ADD CODE TO USER CODES =====
    async function addCodeToUserCodes(userId, code) {
        if (!supabaseClient) return;
        try {
            const { data: codeRecord, error: codeError } = await supabaseClient
                .from('codes').select('id').eq('code', code).single();
            if (codeError) {
                return;
            }

            const { data: existing, error: checkError } = await supabaseClient
                .from('user_codes').select('id').eq('user_id', userId).eq('code_id', codeRecord.id).maybeSingle();
            if (existing) {
                return;
            }

            const { error } = await supabaseClient.from('user_codes').insert({
                user_id: userId,
                code_id: codeRecord.id,
                used_at: new Date().toISOString()
            });
            if (error) {
                console.warn('     user_codes:', error);
            }
        } catch (error) {
            console.warn('    :', error);
        }
    }

    function updateUserCodesStorage() {
        if (!currentUser) return;
        const userCodes = [];
        data.sections.forEach(section => {
            section.teachers.forEach(teacher => {
                if (teacher.codes) {
                    teacher.codes.forEach(code => {
                        if (code.used && code.userEmail === currentUser.email) {
                            userCodes.push({
                                code: code.code,
                                teacherName: teacher.name,
                                sectionName: section.name,
                                usedAt: code.usedAt
                            });
                        }
                    });
                }
            });
        });
        localStorage.setItem('userCodes_' + currentUser.email, JSON.stringify(userCodes));
    }

    function restoreUserCodesFromStorage() {
        if (!currentUser) return;
        const stored = localStorage.getItem('userCodes_' + currentUser.email);
        if (!stored) return;
        try {
            const userCodes = JSON.parse(stored);
            userCodes.forEach(savedCode => {
                data.sections.forEach(section => {
                    section.teachers.forEach(teacher => {
                        if (teacher.codes) {
                            const codeData = teacher.codes.find(c => c.code === savedCode.code);
                            if (codeData && !codeData.used) {
                                codeData.used = true;
                                codeData.userId = currentUser.id;
                                codeData.userEmail = currentUser.email;
                                codeData.deviceId = userDeviceId;
                                codeData.usedAt = savedCode.usedAt || new Date().toISOString();
                            }
                        }
                    });
                });
            });
            saveData();
        } catch (e) {
            console.warn('      ');
        }
    }

    async function loadUserCodesFromSupabase() {
        if (!currentUser || !supabaseClient) return;
        restoreUserCodesFromStorage();
        try {
            const { data: userCodes, error: codesError } = await supabaseClient
                .from('user_codes').select('code_id').eq('user_id', currentUser.id);
            if (codesError) {
                return;
            }
            if (!userCodes || userCodes.length === 0) return;
            const codeIds = userCodes.map(uc => uc.code_id);
            const { data: codesData, error: codesDataError } = await supabaseClient
                .from('codes').select('*').in('id', codeIds);
            if (codesDataError) {
                return;
            }

            let restoredCount = 0;
            codesData.forEach(codeRecord => {
                data.sections.forEach(section => {
                    section.teachers.forEach(teacher => {
                        if (!teacher.codes) teacher.codes = [];
                        const localCode = teacher.codes.find(c => c.code === codeRecord.code);
                        if (localCode) {
                            if (!localCode.used) {
                                localCode.used = true;
                                localCode.userId = currentUser.id;
                                localCode.userEmail = currentUser.email;
                                localCode.deviceId = codeRecord.device_id || userDeviceId;
                                localCode.usedAt = codeRecord.used_at || new Date().toISOString();
                                localCode.locked = codeRecord.is_locked || false;
                                restoredCount++;
                            }
                        }
                    });
                });
            });

            if (restoredCount > 0) {
                saveData();
                updateUserCodesStorage();
                renderAllData();
                renderMyCourses();
                renderAccount();
                updateBadge();
                console.log('  ', restoredCount, '  Supabase');
            }
        } catch (error) {
            console.warn('    :', error);
        }
    }

    // ===== CODE MANAGEMENT =====
    function getCodesStatus(teacher) {
        if (!teacher.codes) return { total: 0, used: 0, available: 0, locked: 0 };
        const total = teacher.codes.length;
        const used = teacher.codes.filter(c => c.used).length;
        const locked = teacher.codes.filter(c => c.locked).length;
        return { total, used, available: total - used, locked };
    }

    // ============================================================
    // =====   =====
    // ============================================================

    function loadContactMessages() {
        try {
            const saved = localStorage.getItem('contactMessages');
            if (saved) {
                contactMessages = JSON.parse(saved);
            }
        } catch (e) {
            contactMessages = [];
        }
    }

    function saveContactMessages() {
        try {
            localStorage.setItem('contactMessages', JSON.stringify(contactMessages));
        } catch (e) {
            console.warn('  ');
        }
    }

    function canUserContact() {
        if (!currentUser) return false;
        return getMyCourses().length > 0;
    }

    function renderContactTeachers() {
        const container = document.getElementById('contactTeachersGrid');
        const countSpan = document.getElementById('contactTeachersCount');
        if (!container) return;
        
        const hasSubscription = canUserContact();
        let contactTeachers = [];
        
        if (hasSubscription) {
            const myCourses = getMyCourses();
            const allTeachers = getAllTeachers();
            
            myCourses.forEach(course => {
                const teacher = allTeachers.find(t => 
                    t.name === course.teacherName && 
                    t._sectionName === course.sectionName
                );
                if (teacher && !contactTeachers.some(t => t.name === teacher.name && t._sectionName === teacher._sectionName)) {
                    contactTeachers.push(teacher);
                }
            });
        }
        
        if (countSpan) countSpan.textContent = contactTeachers.length;
        
        if (!hasSubscription || contactTeachers.length === 0) {
            container.innerHTML = `
                <div class="empty-teachers" style="text-align:center;padding:3rem 1rem;background:var(--bg-card);border-radius:16px;border:2px dashed var(--border);">
                    <span class="empty-icon" style="font-size:4rem;display:block;margin-bottom:0.5rem;"></span>
                    <h3 style="font-size:1.2rem;color:var(--text);"> </h3>
                    <p style="color:var(--text-light);font-size:0.9rem;max-width:400px;margin:0 auto;">
                        ${!currentUser ? '    ' : '         '}
                    </p>
                    <button onclick="navigateTo('teachers')" style="margin-top:1rem;padding:0.5rem 1.5rem;background:var(--primary-gradient);color:white;border:none;border-radius:30px;font-weight:600;cursor:pointer;">
                        <i class="fas fa-book"></i>  
                    </button>
                </div>
            `;
            return;
        }
        
        let html = '<div class="teachers-grid">';
        contactTeachers.forEach(teacher => {
            const name = teacher.name || '';
            const emoji = teacher.emoji || '';
            const subject = teacher.subject || '';
            const image = teacher.image || '';
            const sectionName = teacher._sectionName || '';
            
            html += `
                <div class="teacher-card contact-card" onclick="openContactModal('${name.replace(/'/g, "\\'")}', '${emoji}', '${subject.replace(/'/g, "\\'")}', '${image}')">
                    <div class="teacher-card-image">
                        ${image ? `<img src="${image}" alt="${name}" onerror="this.style.display='none'; this.parentElement.querySelector('.teacher-emoji').style.display='block';">` : ''}
                        <span class="teacher-emoji" style="${image ? 'display:none;' : 'display:block;'}">${emoji}</span>
                        <div class="teacher-badge" style="background:var(--primary-gradient);"></div>
                    </div>
                    <div class="teacher-card-info">
                        <h3>${name}</h3>
                        <div class="teacher-subject">${subject}</div>
                        <div class="teacher-stats">${sectionName}</div>
                    </div>
                    <div class="teacher-card-overlay" style="background:rgba(14,165,233,0.85);">
                        <i class="fas fa-phone"></i>
                        <span></span>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    }

    window.openContactModal = function(name, emoji, subject, image) {
        if (!canUserContact()) {
            showToast('warning', '         ');
            return;
        }
        
        const myCourses = getMyCourses();
        const isSubscribed = myCourses.some(c => c.teacherName === name);
        
        if (!isSubscribed) {
            showToast('warning', '       ');
            return;
        }
        
        document.getElementById('contactTeacherName').textContent = `   ${name}`;
        document.getElementById('contactNameDisplay').textContent = name;
        document.getElementById('contactSubjectDisplay').textContent = subject || '';
        
        const avatarEl = document.getElementById('contactAvatar');
        if (image) {
            avatarEl.innerHTML = `<img src="${image}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
        } else {
            avatarEl.textContent = emoji || '';
        }
        
        document.getElementById('contactSubject').value = '';
        document.getElementById('contactMessage').value = '';
        document.getElementById('attachmentsList').innerHTML = '';
        document.getElementById('contactMessageStatus').innerHTML = '';
        document.getElementById('contactModal').classList.add('active');
        document.body.style.overflow = 'hidden';
        
        document.getElementById('contactForm').dataset.recipient = name;
        document.getElementById('contactForm').dataset.recipientImage = image || '';
        document.getElementById('contactForm').dataset.recipientEmoji = emoji || '';
    };

    window.attachFile = function(type) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = type === 'image' ? 'image/*' : '*/*';
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (!file) return;
            const list = document.getElementById('attachmentsList');
            const item = document.createElement('span');
            item.className = 'attach-item';
            item.innerHTML = `
                <i class="fas fa-${type === 'image' ? 'image' : 'file'}"></i>
                ${file.name}
                <span class="remove-attach" onclick="this.parentElement.remove()"></span>
            `;
            list.appendChild(item);
        };
        input.click();
    };

    document.getElementById('contactForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const recipient = this.dataset.recipient || '';
        const subject = document.getElementById('contactSubject').value.trim();
        const message = document.getElementById('contactMessage').value.trim();
        const status = document.getElementById('contactMessageStatus');
        
        if (!subject) {
            status.innerHTML = '    ';
            status.style.color = '#f59e0b';
            return;
        }
        
        if (!message) {
            status.innerHTML = '    ';
            status.style.color = '#f59e0b';
            return;
        }
        
        const attachments = [];
        document.querySelectorAll('#attachmentsList .attach-item').forEach(el => {
            attachments.push(el.textContent.replace('', '').trim());
        });
        
        const msgData = {
            id: Date.now(),
            recipient: recipient,
            recipientImage: this.dataset.recipientImage || '',
            recipientEmoji: this.dataset.recipientEmoji || '',
            sender: currentUser?.email || '',
            senderName: currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || '',
            senderAvatar: currentUser?.user_metadata?.avatar_url || '',
            subject: subject,
            message: message,
            attachments: attachments,
            sentAt: new Date().toISOString(),
            read: false
        };
        
        contactMessages.push(msgData);
        saveContactMessages();
        
        status.innerHTML = '    !   .';
        status.style.color = '#22c55e';
        this.reset();
        document.getElementById('attachmentsList').innerHTML = '';
        showToast('success', '     ' + recipient);
        
        updateContactBadge();
        renderMyMessages();
        renderAllMessages();
        
        setTimeout(() => {
            document.getElementById('contactModal').classList.remove('active');
            document.body.style.overflow = 'auto';
        }, 2000);
    });

    document.getElementById('closeContactModal')?.addEventListener('click', function() {
        document.getElementById('contactModal').classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    document.getElementById('contactModal')?.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

    function renderMyMessages() {
        const container = document.getElementById('myMessagesList');
        if (!container) return;
        
        if (!currentUser) {
            container.innerHTML = '<p style="color:var(--text-light);font-size:0.8rem;text-align:center;">  </p>';
            return;
        }
        
        const myMessages = contactMessages.filter(m => m.sender === currentUser.email);
        
        if (myMessages.length === 0) {
            container.innerHTML = '<p style="color:var(--text-light);font-size:0.8rem;text-align:center;">   </p>';
            return;
        }
        
        let html = '';
        myMessages.slice().reverse().forEach(msg => {
            const isRead = msg.read || false;
            html += `
                <div class="message-item">
                    <div class="msg-header">
                        <span><i class="fas fa-user"></i> ${msg.recipient}</span>
                        <span>${new Date(msg.sentAt).toLocaleString('ar')}</span>
                    </div>
                    <div class="msg-subject">${msg.subject}</div>
                    <div class="msg-body">${msg.message}</div>
                    ${msg.attachments.length ? `<div class="msg-attachments"><i class="fas fa-paperclip"></i> ${msg.attachments.length} </div>` : ''}
                    <div class="msg-status ${isRead ? 'read' : 'unread'}">
                        ${isRead ? ' ' : '  '}
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
        
        const msgCountEl = document.getElementById('accountMessages');
        if (msgCountEl) msgCountEl.textContent = myMessages.length;
    }

    function renderAllMessages() {
        const container = document.getElementById('allMessagesContainer');
        if (!container) return;
        
        if (contactMessages.length === 0) {
            container.innerHTML = '<p style="color:var(--text-light);text-align:center;padding:0.5rem 0;font-size:.8rem;">  </p>';
            return;
        }
        
        let html = '<div style="display:flex;flex-direction:column;gap:0.5rem;">';
        contactMessages.slice().reverse().forEach(msg => {
            const isRead = msg.read || false;
            html += `
                <div style="background:var(--bg);border-radius:8px;padding:0.6rem 0.8rem;border-right:3px solid ${isRead ? '#22c55e' : '#f59e0b'};">
                    <div style="display:flex;justify-content:space-between;font-size:0.65rem;color:var(--text-light);flex-wrap:wrap;">
                        <span><i class="fas fa-user"></i> <strong>:</strong> ${msg.senderName} (${msg.sender})</span>
                        <span><i class="fas fa-user-tie"></i> <strong>:</strong> ${msg.recipient}</span>
                        <span>${new Date(msg.sentAt).toLocaleString('ar')}</span>
                    </div>
                    <div style="font-weight:600;font-size:0.85rem;">${msg.subject}</div>
                    <div style="font-size:0.75rem;color:var(--text-light);">${msg.message}</div>
                    ${msg.attachments.length ? `<div style="font-size:0.6rem;color:var(--primary);"><i class="fas fa-paperclip"></i> ${msg.attachments.length} </div>` : ''}
                    <div style="font-size:0.6rem;color:${isRead ? '#22c55e' : '#f59e0b'};">
                        ${isRead ? ' ' : '  '}
                        <button onclick="markMessageAsRead(${msg.id})" style="background:var(--primary);color:white;border:none;border-radius:4px;padding:0.1rem 0.4rem;cursor:pointer;font-size:0.55rem;margin-right:0.5rem;">
                            ${isRead ? ' ' : '  '}
                        </button>
                        <button onclick="deleteMessage(${msg.id})" style="background:#ef4444;color:white;border:none;border-radius:4px;padding:0.1rem 0.4rem;cursor:pointer;font-size:0.55rem;">
                            
                        </button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    }

    window.markMessageAsRead = function(id) {
        const msg = contactMessages.find(m => m.id === id);
        if (msg) {
            msg.read = true;
            saveContactMessages();
            renderAllMessages();
            renderMyMessages();
            updateContactBadge();
            showToast('success', '    ');
        }
    };

    window.deleteMessage = function(id) {
        if (!confirm('       ')) return;
        contactMessages = contactMessages.filter(m => m.id !== id);
        saveContactMessages();
        renderAllMessages();
        renderMyMessages();
        updateContactBadge();
        showToast('success', '   ');
    };

    function updateContactBadge() {
        const unread = contactMessages.filter(m => !m.read).length;
        const badge = document.getElementById('contactBadge');
        if (badge) {
            if (unread > 0) {
                badge.style.display = 'inline';
                badge.textContent = unread;
            } else {
                badge.style.display = 'none';
            }
        }
    }

    function checkContactMessages() {
        updateContactBadge();
    }

    // ============================================================
    // DATA FUNCTIONS
    // ============================================================

    function normalizeDataStructure(courseData) {
        if (!courseData || !Array.isArray(courseData.sections)) {
            courseData.sections = [];
        }
        courseData.sections.forEach(section => {
            if (!Array.isArray(section.teachers)) { section.teachers = []; }
            section.teachers.forEach(teacher => {
                if (!Array.isArray(teacher.codes)) { teacher.codes = []; }
                if (!Array.isArray(teacher.semesters)) { teacher.semesters = []; }
                teacher.codes.forEach(c => {
                    if (c.used === undefined) c.used = false;
                    if (c.locked === undefined) c.locked = false;
                    if (!('deviceId' in c)) c.deviceId = null;
                    if (!('usedAt' in c)) c.usedAt = null;
                    if (!('userId' in c)) c.userId = null;
                    if (!('userEmail' in c)) c.userEmail = null;
                });
                teacher.semesters.forEach(semester => {
                    if (!Array.isArray(semester.lectures)) { semester.lectures = []; }
                    semester.lectures.forEach(lecture => {
                        if (lecture.isFree === undefined) lecture.isFree = false;
                        if (!('youtubeUrl' in lecture)) lecture.youtubeUrl = '';
                        if (!('title' in lecture)) lecture.title = '';
                        if (lecture.number === undefined) lecture.number = 0;
                    });
                });
            });
        });
    }

    async function loadData() {
        try {
            if (supabaseClient) {
                const remoteData = await getSupabaseAcademyData();
                if (remoteData && remoteData.sections && Array.isArray(remoteData.sections)) {
                    data = remoteData;
                    normalizeDataStructure(data);
                    localStorage.setItem('academyData', JSON.stringify(data));
                    console.log('     Supabase');
                    return;
                }
            }
            const savedData = localStorage.getItem('academyData');
            if (savedData) {
                try {
                    const parsed = JSON.parse(savedData);
                    if (parsed && parsed.sections && Array.isArray(parsed.sections)) {
                        data = parsed;
                        normalizeDataStructure(data);
                        console.log('     localStorage');
                        return;
                    }
                } catch (e) { console.warn('  localStorage '); }
            }
            data = { sections: JSON.parse(JSON.stringify(defaultSections)) };
            normalizeDataStructure(data);
            localStorage.setItem('academyData', JSON.stringify(data));
            showToast('info', '    ');
        } catch (error) {
            console.warn('   :', error.message);
        }
    }

    function saveData() {
        try {
            localStorage.setItem('academyData', JSON.stringify(data));
            console.log('    ');
        } catch (error) {
            console.error('    :', error);
            showToast('error', '    ');
        }
    }

    async function getSupabaseAcademyData() {
        if (!supabaseClient) return null;
        try {
            const { data, error } = await supabaseClient
                .from('academy_data').select('content').eq('id', 'main').maybeSingle();
            if (error) { console.warn('Supabase academy data lookup failed:', error.message || error); return null; }
            return data?.content || null;
        } catch (error) { console.warn('Supabase academy data exception:', error); return null; }
    }

    async function saveSupabaseAcademyData() {
        if (!supabaseClient) return { success: false, error: 'Supabase  ' };
        try {
            const record = { id: 'main', content: data, updated_at: new Date().toISOString() };
            const { error } = await supabaseClient.from('academy_data').upsert(record, { onConflict: 'id' });
            if (error) { console.warn('Supabase academy data save failed:', error.message || error); return { success: false,
                    error }; }
            localStorage.setItem('academyData', JSON.stringify(data));
            return { success: true };
        } catch (error) { console.warn('Supabase academy data save exception:', error); return { success: false,
                error }; }
    }

    // ============================================================
    //    
    // ============================================================

    function getAllTeachers() {
        const teachers = [];
        data.sections.forEach((section, sectionIndex) => {
            section.teachers.forEach((teacher, teacherIndex) => {
                teachers.push({
                    ...teacher,
                    _sectionIndex: sectionIndex,
                    _teacherIndex: teacherIndex,
                    _sectionName: section.name,
                    _sectionId: section.id
                });
            });
        });
        return teachers;
    }

    function getTeachersBySection(sectionId) {
        const section = data.sections.find(s => s.id === sectionId);
        if (!section) return [];
        return section.teachers.map((teacher, index) => ({
            ...teacher,
            _sectionIndex: data.sections.indexOf(section),
            _teacherIndex: index,
            _sectionName: section.name,
            _sectionId: section.id
        }));
    }

    function getFilteredTeachers() {
        if (currentFilter === 'all') {
            return getAllTeachers();
        }
        return getTeachersBySection(currentFilter);
    }

    function buildFilterButtons(container, countContainer) {
        if (!container) return;

        let html = `<button class="filter-btn active" data-section="all" onclick="setFilter('all')">
            <span class="btn-icon"></span> 
            <span class="btn-count">${getAllTeachers().length}</span>
        </button>`;

        data.sections.forEach(section => {
            const teacherCount = section.teachers ? section.teachers.length : 0;
            const isActive = currentFilter === section.id;
            html += `<button class="filter-btn ${isActive ? 'active' : ''}" data-section="${section.id}" onclick="setFilter('${section.id}')">
                <span class="btn-icon"></span> ${section.name}
                <span class="btn-count">${teacherCount}</span>
            </button>`;
        });

        container.innerHTML = html;

        if (countContainer) {
            const filtered = getFilteredTeachers();
            countContainer.textContent = filtered.length;
        }
    }

    window.setFilter = function(sectionId) {
        currentFilter = sectionId;
        renderAllData();
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.section === sectionId);
        });
    };

    function renderTeachers(teachers, container) {
        if (!container) return;

        if (!teachers || teachers.length === 0) {
            container.innerHTML = `
                <div class="empty-teachers">
                    <span class="empty-icon"></span>
                    <h3>  </h3>
                    <p>${currentFilter === 'all' ? '     ' : '     '}</p>
                </div>
            `;
            return;
        }

        let html = `<div class="teachers-grid">`;

        teachers.forEach((teacher) => {
            const hasAccess = hasAccessToTeacher(teacher);
            const canContact = canUserContact() && hasAccess;
            const imageUrl = teacher.image || '';
            const emoji = teacher.emoji || '';
            const name = teacher.name || '';
            const subject = teacher.subject || '';
            const semestersCount = Array.isArray(teacher.semesters) ? teacher.semesters.length : 0;
            const sectionName = teacher._sectionName || '';

            html += `
                <div class="teacher-card" onclick="openTeacher(${teacher._sectionIndex}, ${teacher._teacherIndex})">
                    <div class="teacher-section-badge">${sectionName}</div>
                    <div class="teacher-card-image">
                        ${imageUrl ? `<img src="${imageUrl}" alt="${name}" onerror="this.style.display='none'; this.parentElement.querySelector('.teacher-emoji').style.display='block';">` : ''}
                        <span class="teacher-emoji" style="${imageUrl ? 'display:none;' : 'display:block;'}">${emoji}</span>
                        ${hasAccess ? '<div class="teacher-badge"></div>' : ''}
                    </div>
                    <div class="teacher-card-info">
                        <h3>${name}</h3>
                        ${subject ? `<div class="teacher-subject">${subject}</div>` : ''}
                        <div class="teacher-stats"> ${semestersCount} </div>
                    </div>
                    <div class="teacher-card-overlay">
                        <i class="fas fa-chevron-left"></i>
                        <span></span>
                    </div>
                    ${canContact ? `
                        <button class="btn-contact" onclick="event.stopPropagation();openContactModal('${name.replace(/'/g, "\\'")}', '${emoji}', '${subject.replace(/'/g, "\\'")}', '${imageUrl}')">
                            <i class="fas fa-phone"></i>
                        </button>
                    ` : ''}
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;
    }

    function renderAllData() {
        const filteredTeachers = getFilteredTeachers();

        if (teachersCount) teachersCount.textContent = filteredTeachers.length;
        if (teachersCount2) teachersCount2.textContent = filteredTeachers.length;

        renderTeachers(filteredTeachers, teachersGridContainer);
        renderTeachers(filteredTeachers, teachersGridContainer2);

        buildFilterButtons(sectionFilter, teachersCount);
        buildFilterButtons(sectionFilter2, teachersCount2);
    }

    // ===== OPEN TEACHER =====
    window.openTeacher = function(sectionIndex, teacherIndex) {
        const section = data.sections[sectionIndex];
        if (!section) return;
        const teacher = section.teachers[teacherIndex];
        if (!teacher) return;

        activeTeacher = teacher;
        activeTeacherIndex = teacherIndex;
        activeSectionIndex = sectionIndex;

        const hasAccess = hasAccessToTeacher(teacher);
        modalTeacherTitle.textContent = ` ${teacher.name} (${section.name})`;

        const semesters = Array.isArray(teacher.semesters) ? teacher.semesters : [];
        let html = '';

        semesters.forEach((semester, idx) => {
            const lectures = Array.isArray(semester.lectures) ? semester.lectures : [];
            const hasFreeLecture = lectures.some(l => l.isFree === true);
            const isLocked = !hasAccess && !hasFreeLecture;

            html += `
                <div class="semester-item ${isLocked ? 'locked' : ''}" 
                     onclick="${isLocked ? '' : `openLectures(${sectionIndex}, ${teacherIndex}, ${idx})`}">
                    <div>
                        <div class="semester-number">  ${semester.number}</div>
                        <div class="semester-desc">${semester.description || ''} (${semester.lectures.length} )</div>
                    </div>
                    <div class="semester-status">
                        ${isLocked ? ' ' : (hasAccess ? ' ' : ' ')}
                        <i class="fas fa-chevron-left"></i>
                    </div>
                </div>
            `;
        });

        const isActivated = hasAccessToTeacher(teacher);
        html += `
            <div class="codes-info">
                <div class="access-status ${isActivated ? 'active' : 'inactive'}">
                    ${isActivated ? '   -   ' : '    -   '}
                </div>
                ${!isActivated ? `
                    <div class="code-box-mini" style="margin-top:0.8rem;background:var(--bg);padding:0.8rem;border-radius:var(--radius-sm);">
                        <p style="font-size:0.85rem;margin-bottom:0.3rem;">      </p>
                        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
                            <input type="password" id="codeInputTeacher" placeholder=" ..." maxlength="20" style="flex:1;min-width:120px;padding:0.5rem 0.8rem;border:2px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text);font-size:0.9rem;outline:none;text-align:center;letter-spacing:2px;font-weight:700;font-family:monospace;" />
                            <button onclick="activateCodeFromTeacher()" style="padding:0.5rem 1.2rem;background:var(--primary-gradient);color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;"></button>
                        </div>
                        <div id="codeMessageTeacher" style="margin-top:0.3rem;font-size:0.85rem;"></div>
                    </div>
                ` : ''}
            </div>
        `;

        semestersList.innerHTML = html;
        semestersModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    window.activateCodeFromTeacher = async function() {
        const codeInput = document.getElementById('codeInputTeacher');
        const codeMessage = document.getElementById('codeMessageTeacher');
        const code = codeInput.value.trim().toUpperCase();

        if (!code) {
            codeMessage.innerHTML = '   ';
            codeMessage.style.color = '#f59e0b';
            return;
        }

        if (!activeTeacher) {
            codeMessage.innerHTML = '    ';
            codeMessage.style.color = '#f59e0b';
            return;
        }

        if (!currentUser) {
            codeMessage.innerHTML = '    ';
            codeMessage.style.color = '#ef4444';
            showToast('error', '    ');
            return;
        }

        const result = await verifyCode(activeTeacher, code);
        codeMessage.innerHTML = result.message;
        codeMessage.style.color = result.valid ? '#22c55e' : '#ef4444';

        if (result.valid) {
            showToast('success', '   !');
            renderAllData();
            renderMyCourses();
            renderAccount();
            updateBadge();
            updateUserCodesStorage();

            setTimeout(() => {
                if (activeSectionIndex !== null && activeTeacherIndex !== null) {
                    openTeacher(activeSectionIndex, activeTeacherIndex);
                }
            }, 1500);
        } else {
            showToast('error', ' ' + result.message);
        }
    };

    window.openLectures = function(sectionIndex, teacherIndex, semesterIndex) {
        const section = data.sections[sectionIndex];
        if (!section) return;
        const teacher = section.teachers[teacherIndex];
        if (!teacher) return;
        const semester = teacher.semesters[semesterIndex];
        if (!semester) return;

        const hasAccess = hasAccessToTeacher(teacher);
        modalSemesterTitle.textContent = `  ${semester.number} - ${teacher.name}`;

        let html = '';
        const lectures = Array.isArray(semester.lectures) ? semester.lectures : [];

        lectures.forEach((lecture) => {
            const isFree = lecture.isFree === true;
            const canWatch = isFree || hasAccess;
            const videoUrl = lecture.youtubeUrl || '';
            const isMediaDelivery = videoUrl.includes('mediadelivery');
            const videoIcon = isMediaDelivery ? 'fa-video' : 'fa-play-circle';

            html += `
                <div class="lecture-item ${canWatch ? '' : 'locked'}" 
                     onclick="${canWatch ? `playVideo('${videoUrl}', '${lecture.title}')` : ''}">
                    <div class="lecture-number">#${lecture.number}</div>
                    <div class="lecture-title">${lecture.title}</div>
                    <div class="lecture-status">
                        ${isFree ? '<span class="free-badge"> </span>' : ''}
                        ${isMediaDelivery ? '<span style="font-size:0.6rem;color:var(--primary);margin-left:0.3rem;"></span>' : ''}
                        ${canWatch ? `<i class="fas ${videoIcon}" style="color:var(--primary);"></i>` : '<i class="fas fa-lock" style="color:#ef4444;"></i>'}
                    </div>
                </div>
            `;
        });

        lecturesList.innerHTML = html;
        lecturesModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    // ===== MY COURSES =====
    function getMyCourses() {
        if (!currentUser) return [];
        const courses = [];

        data.sections.forEach(section => {
            section.teachers.forEach((teacher, teacherIndex) => {
                if (teacher.codes) {
                    const hasAccess = teacher.codes.some(c => c.used && c.userEmail === currentUser.email && !c.locked);
                    if (hasAccess) {
                        courses.push({
                            teacherName: teacher.name,
                            teacherEmoji: teacher.emoji || '',
                            teacherImage: teacher.image || '',
                            sectionName: section.name,
                            sectionIndex: data.sections.indexOf(section),
                            teacherIndex: teacherIndex,
                            codes: teacher.codes.filter(c => c.used && c.userEmail === currentUser.email)
                        });
                    }
                }
            });
        });

        return courses;
    }

    function renderMyCourses() {
        const container = document.getElementById('myCoursesContainer');
        const countSpan = document.getElementById('myCoursesCount');
        if (!container) return;

        const courses = getMyCourses();
        if (countSpan) countSpan.textContent = courses.length + ' ';

        if (courses.length === 0) {
            container.innerHTML = `
                <div class="empty-courses">
                    <span class="empty-icon"></span>
                    <h3>     </h3>
                    <p>      </p>
                    <button class="btn-primary" onclick="navigateTo('teachers')">
                        <i class="fas fa-search"></i>  
                    </button>
                </div>
            `;
            return;
        }

        let html = '<div class="my-courses-grid">';
        courses.forEach(course => {
            html += `
                <div class="course-card-mini" onclick="openTeacher(${course.sectionIndex}, ${course.teacherIndex})">
                    <div class="course-avatar">
                        ${course.teacherImage ? `<img src="${course.teacherImage}" />` : course.teacherEmoji}
                    </div>
                    <div class="course-name">${course.teacherName}</div>
                    <div class="course-meta">${course.sectionName} | ${course.codes.length} </div>
                    <div class="course-badge"> </div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    }

    // ===== ACCOUNT =====
    function renderAccount() {
        if (!currentUser) {
            accountName.textContent = ' ';
            accountEmail.textContent = '  ';
            accountAvatar.textContent = '';
            accountRegistered.textContent = '--';
            accountCourses.textContent = '0';
            accountCodes.textContent = '0';
            if (accountMessages) accountMessages.textContent = '0';
            adminPanelBtn.style.display = 'none';
            return;
        }

        const name = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || '';
        accountName.textContent = name;
        accountEmail.textContent = currentUser.email;
        accountAvatar.textContent = name.charAt(0).toUpperCase();

        const registered = currentUser.created_at ? new Date(currentUser.created_at).toLocaleDateString('ar') : ' ';
        accountRegistered.textContent = ' : ' + registered;

        const courses = getMyCourses();
        accountCourses.textContent = courses.length;

        let codesCount = 0;
        data.sections.forEach(section => {
            section.teachers.forEach(teacher => {
                if (teacher.codes) {
                    codesCount += teacher.codes.filter(c => c.used && c.userEmail === currentUser.email).length;
                }
            });
        });
        accountCodes.textContent = codesCount;

        const userMessages = contactMessages.filter(m => m.sender === currentUser.email);
        if (accountMessages) accountMessages.textContent = userMessages.length;

        const userEmail = currentUser.email;
        
        if (ADMIN_EMAILS.includes(userEmail)) {
            adminPanelBtn.style.display = 'flex';
            return;
        }
        
        isUserAdmin(userEmail).then(isAdmin => {
            if (isAdmin) {
                adminPanelBtn.style.display = 'flex';
            } else {
                adminPanelBtn.style.display = 'none';
            }
        }).catch(err => {
            if (ADMIN_EMAILS.includes(userEmail)) {
                adminPanelBtn.style.display = 'flex';
            } else {
                adminPanelBtn.style.display = 'none';
            }
        });
    }

    function updateBadge() {
        const courses = getMyCourses();
        if (courses.length > 0) {
            coursesBadge.style.display = 'inline';
            coursesBadge.textContent = courses.length;
        } else {
            coursesBadge.style.display = 'none';
        }
    }

    // ===== AUTH =====
    async function signOut() {
        try {
            localStorage.removeItem('devAcademicUser');
            if (supabaseClient) {
                await supabaseClient.auth.signOut();
            }
            currentUser = null;
            activeTeacher = null;
            activeTeacherIndex = null;
            activeSectionIndex = null;
            updateUI();
            if (adminPanel) adminPanel.classList.remove('active');
            if (semestersModal) semestersModal.classList.remove('active');
            if (lecturesModal) lecturesModal.classList.remove('active');
            if (teachersModal) teachersModal.classList.remove('active');
            if (editLectureModal) editLectureModal.classList.remove('active');
            renderMyCourses();
            renderAccount();
            updateBadge();
            renderAllData();
            showToast('success', '    ');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
        } catch (error) {
            console.warn('SignOut exception:', error);
            showToast('error', '     ');
        }
    }

    // ===== UPDATE UI =====
    function updateUI() {
        if (currentUser) {
            const name = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || '';
            userNameDisplay.textContent = name;
            userAvatar.textContent = name.charAt(0).toUpperCase();
        } else {
            userNameDisplay.textContent = ' ';
            userAvatar.textContent = '';
        }
    }

    // ===== NAVIGATION =====
    window.navigateTo = function(page) {
        if (!currentUser) {
            window.location.href = 'index.html';
            return;
        }

        document.querySelectorAll('[id^="page-"]').forEach(p => p.style.display = 'none');
        const targetPage = document.getElementById('page-' + page);
        if (targetPage) targetPage.style.display = 'block';

        document.querySelectorAll('.nav-links li').forEach(l => l.classList.remove('active'));
        document.querySelector(`.nav-links li a[data-page="${page}"]`)?.closest('li')?.classList.add('active');

        bottomNavItems.forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        const hero = document.getElementById('hero');
        if (hero) {
            hero.style.display = page === 'home' ? 'flex' : 'none';
        }

        if (page === 'my-courses') {
            renderMyCourses();
            updateBadge();
        }
        if (page === 'account') {
            renderAccount();
            renderMyMessages();
        }
        if (page === 'teachers' || page === 'home') {
            renderAllData();
        }
        if (page === 'contact') {
            renderContactTeachers();
            checkContactMessages();
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ===== NAVIGATION EVENTS =====
    document.querySelectorAll('[data-page]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            navigateTo(this.dataset.page);
        });
    });

    bottomNavItems.forEach(item => {
        item.addEventListener('click', function() {
            navigateTo(this.dataset.page);
        });
    });

    // ===== USER PROFILE CLICK =====
    document.getElementById('userProfileBtn')?.addEventListener('click', function() {
        if (!currentUser) {
            window.location.href = 'index.html';
            return;
        }
        navigateTo('account');
    });

    // ===== LOGOUT =====
    logoutAccountBtn?.addEventListener('click', signOut);

    // ===== ADMIN PANEL BUTTON =====
    adminPanelBtn?.addEventListener('click', function() {
        if (!currentUser) {
            showToast('warning', '    ');
            return;
        }
        
        if (ADMIN_EMAILS.includes(currentUser.email)) {
            adminPanel.classList.add('active');
            updateAllAdminSelects();
            updatePendingChanges();
            loadAdminsList();
            renderAllMessages();
            showToast('success', '     ');
            return;
        }
        
        isUserAdmin(currentUser.email).then(isAdmin => {
            if (isAdmin) {
                adminPanel.classList.add('active');
                updateAllAdminSelects();
                updatePendingChanges();
                loadAdminsList();
                renderAllMessages();
                showToast('success', '     ');
            } else {
                showToast('error', '       ');
            }
        });
    });

    adminClose?.addEventListener('click', function() {
        adminPanel.classList.remove('active');
    });

    // ===== THEME =====
    function toggleTheme() {
        isDarkMode = !isDarkMode;
        document.body.classList.toggle('dark-mode', isDarkMode);
        themeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        localStorage.setItem('devAcademicTheme', isDarkMode ? 'dark' : 'light');
        showToast('info', isDarkMode ? '    ' : '    ');
    }

    themeToggle.addEventListener('click', toggleTheme);

    // ===== SEARCH =====
    function applyFilters() {
        const term = searchInput.value.trim().toLowerCase();
        if (term === '') {
            renderAllData();
            return;
        }

        const allTeachers = getAllTeachers();
        const filtered = allTeachers.filter(t =>
            t.name.toLowerCase().includes(term) ||
            (t.subject && t.subject.toLowerCase().includes(term)) ||
            (t.description && t.description.toLowerCase().includes(term)) ||
            (t._sectionName && t._sectionName.toLowerCase().includes(term))
        );

        renderTeachers(filtered, teachersGridContainer);
        renderTeachers(filtered, teachersGridContainer2);
    }

    searchBtn.addEventListener('click', applyFilters);
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') applyFilters();
    });

    // ===== MODALS =====
    function closeModal(modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    closeTeachersModal?.addEventListener('click', () => closeModal(teachersModal));
    closeSemestersModal?.addEventListener('click', () => closeModal(semestersModal));
    closeLecturesModal?.addEventListener('click', () => closeModal(lecturesModal));

    teachersModal?.addEventListener('click', function(e) {
        if (e.target === this) closeModal(this);
    });
    semestersModal?.addEventListener('click', function(e) {
        if (e.target === this) closeModal(this);
    });
    lecturesModal?.addEventListener('click', function(e) {
        if (e.target === this) closeModal(this);
    });

    // ===== VIDEO PLAYER EVENTS =====
    closePlayer.addEventListener('click', closeVideoPlayer);
    videoPlayer.addEventListener('click', function(e) {
        if (e.target === this) closeVideoPlayer();
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (videoPlayer.classList.contains('active')) closeVideoPlayer();
            if (teachersModal.classList.contains('active')) closeModal(teachersModal);
            if (semestersModal.classList.contains('active')) closeModal(semestersModal);
            if (lecturesModal.classList.contains('active')) closeModal(lecturesModal);
            if (editLectureModal.classList.contains('active')) closeEditLectureModal();
            if (adminPanel.classList.contains('active')) adminPanel.classList.remove('active');
        }
    });

    // ============================================================
    //       
    // ============================================================

    function updateAllAdminSelects() {
        updateBasicSelects();
        updateTeacherSelects();
        updateSemesterSelects();
        updateLectureSelects();
        updateDeleteSelects();
        updateEditSelects();
        updateCodeSelects();
        updateCodesManagement();
    }

    function updateBasicSelects() {
        const selectIds = [
            'teacherSection', 'semesterSection', 'lectureSection',
            'codeSection', 'editTeacherSection', 'editLectureSection',
            'deleteSection', 'deleteTeacherSection', 'deleteSemesterSection',
            'deleteLectureSection'
        ];

        selectIds.forEach(id => {
            const select = document.getElementById(id);
            if (!select) return;
            const currentValue = select.value;
            let options = '<option value=""> ...</option>';
            data.sections.forEach((s, i) => {
                options += `<option value="${i}">${s.name}</option>`;
            });
            select.innerHTML = options;
            if (currentValue && data.sections[parseInt(currentValue)]) {
                select.value = currentValue;
            }
        });
    }

    function updateTeacherSelects() {
        const teacherSelects = [
            { selectId: 'semesterTeacher', sectionId: 'semesterSection' },
            { selectId: 'lectureTeacher', sectionId: 'lectureSection' },
            { selectId: 'editTeacherSelect', sectionId: 'editTeacherSection' },
            { selectId: 'editLectureTeacher', sectionId: 'editLectureSection' },
            { selectId: 'deleteTeacherSelect', sectionId: 'deleteTeacherSection' },
            { selectId: 'deleteSemesterTeacher', sectionId: 'deleteSemesterSection' },
            { selectId: 'deleteLectureTeacher', sectionId: 'deleteLectureSection' }
        ];

        teacherSelects.forEach(({ selectId, sectionId }) => {
            const select = document.getElementById(selectId);
            const sectionSelect = document.getElementById(sectionId);
            if (!select || !sectionSelect) return;

            const sectionIndex = parseInt(sectionSelect.value);
            const currentValue = select.value;
            let options = '<option value=""> ...</option>';

            if (!isNaN(sectionIndex) && sectionIndex >= 0 && data.sections[sectionIndex]) {
                data.sections[sectionIndex].teachers.forEach((t, i) => {
                    options += `<option value="${i}">${t.name}</option>`;
                });
            }

            select.innerHTML = options;
            if (currentValue && !isNaN(sectionIndex) && sectionIndex >= 0 &&
                data.sections[sectionIndex]?.teachers[parseInt(currentValue)]) {
                select.value = currentValue;
            }
        });
    }

    function updateSemesterSelects() {
        const semesterSelects = [
            { selectId: 'lectureSemester', teacherId: 'lectureTeacher', sectionId: 'lectureSection' },
            { selectId: 'deleteSemesterSelect', teacherId: 'deleteSemesterTeacher', sectionId: 'deleteSemesterSection' },
            { selectId: 'deleteLectureSemester', teacherId: 'deleteLectureTeacher', sectionId: 'deleteLectureSection' },
            { selectId: 'editLectureSemester', teacherId: 'editLectureTeacher', sectionId: 'editLectureSection' }
        ];

        semesterSelects.forEach(({ selectId, teacherId, sectionId }) => {
            const select = document.getElementById(selectId);
            const teacherSelect = document.getElementById(teacherId);
            const sectionSelect = document.getElementById(sectionId);
            if (!select || !teacherSelect || !sectionSelect) return;

            const sectionIndex = parseInt(sectionSelect.value);
            const teacherIndex = parseInt(teacherSelect.value);
            const currentValue = select.value;

            let options = '<option value=""> ...</option>';
            if (!isNaN(sectionIndex) && sectionIndex >= 0 &&
                !isNaN(teacherIndex) && teacherIndex >= 0 &&
                data.sections[sectionIndex]?.teachers[teacherIndex]) {
                const teacher = data.sections[sectionIndex].teachers[teacherIndex];
                if (teacher.semesters) {
                    teacher.semesters.forEach((s, i) => {
                        options += `<option value="${i}"> ${s.number} - ${s.description || ''}</option>`;
                    });
                }
            }

            select.innerHTML = options;
            if (currentValue && !isNaN(sectionIndex) && sectionIndex >= 0 &&
                !isNaN(teacherIndex) && teacherIndex >= 0 &&
                data.sections[sectionIndex]?.teachers[teacherIndex]?.semesters[parseInt(currentValue)]) {
                select.value = currentValue;
            }
        });
    }

    function updateLectureSelects() {
        const lectureSelects = [
            { selectId: 'editLectureSelect', semesterId: 'editLectureSemester', sectionId: 'editLectureSection', teacherId: 'editLectureTeacher' },
            { selectId: 'deleteLectureSelect', semesterId: 'deleteLectureSemester', sectionId: 'deleteLectureSection', teacherId: 'deleteLectureTeacher' }
        ];

        lectureSelects.forEach(({ selectId, semesterId, sectionId, teacherId }) => {
            const select = document.getElementById(selectId);
            const semesterSelect = document.getElementById(semesterId);
            const sectionSelect = document.getElementById(sectionId);
            const teacherSelect = document.getElementById(teacherId);
            if (!select || !semesterSelect || !sectionSelect || !teacherSelect) return;

            const sectionIndex = parseInt(sectionSelect.value);
            const teacherIndex = parseInt(teacherSelect.value);
            const semesterIndex = parseInt(semesterSelect.value);
            const currentValue = select.value;

            let options = '<option value=""> ...</option>';
            if (!isNaN(sectionIndex) && sectionIndex >= 0 &&
                !isNaN(teacherIndex) && teacherIndex >= 0 &&
                !isNaN(semesterIndex) && semesterIndex >= 0 &&
                data.sections[sectionIndex]?.teachers[teacherIndex]?.semesters[semesterIndex]?.lectures) {
                const lectures = data.sections[sectionIndex].teachers[teacherIndex].semesters[semesterIndex].lectures;
                lectures.forEach((l, i) => {
                    options += `<option value="${i}">#${l.number} - ${l.title}</option>`;
                });
            }

            select.innerHTML = options;
            if (currentValue && !isNaN(sectionIndex) && sectionIndex >= 0 &&
                !isNaN(teacherIndex) && teacherIndex >= 0 &&
                !isNaN(semesterIndex) && semesterIndex >= 0 &&
                data.sections[sectionIndex]?.teachers[teacherIndex]?.semesters[semesterIndex]?.lectures[parseInt(currentValue)]) {
                select.value = currentValue;
            }
        });
    }

    function updateDeleteSelects() {
        const deleteTeacherSelect = document.getElementById('deleteTeacherSelect');
        const deleteTeacherSection = document.getElementById('deleteTeacherSection');
        if (deleteTeacherSelect && deleteTeacherSection) {
            const sectionIndex = parseInt(deleteTeacherSection.value);
            const currentValue = deleteTeacherSelect.value;
            let options = '<option value=""> ...</option>';
            if (!isNaN(sectionIndex) && sectionIndex >= 0 && data.sections[sectionIndex]) {
                data.sections[sectionIndex].teachers.forEach((t, i) => {
                    options += `<option value="${i}">${t.name}</option>`;
                });
            }
            deleteTeacherSelect.innerHTML = options;
            if (currentValue && !isNaN(sectionIndex) && sectionIndex >= 0 &&
                data.sections[sectionIndex]?.teachers[parseInt(currentValue)]) {
                deleteTeacherSelect.value = currentValue;
            }
        }
    }

    function updateEditSelects() {
        const editTeacherSelect = document.getElementById('editTeacherSelect');
        const editTeacherSection = document.getElementById('editTeacherSection');
        if (editTeacherSelect && editTeacherSection) {
            const sectionIndex = parseInt(editTeacherSection.value);
            const currentValue = editTeacherSelect.value;
            let options = '<option value=""> ...</option>';
            if (!isNaN(sectionIndex) && sectionIndex >= 0 && data.sections[sectionIndex]) {
                data.sections[sectionIndex].teachers.forEach((t, i) => {
                    options += `<option value="${i}">${t.name}</option>`;
                });
            }
            editTeacherSelect.innerHTML = options;
            if (currentValue && !isNaN(sectionIndex) && sectionIndex >= 0 &&
                data.sections[sectionIndex]?.teachers[parseInt(currentValue)]) {
                editTeacherSelect.value = currentValue;
            }
            updateEditTeacherData();
        }
    }

    function updateCodeSelects() {
        const sectionSelect = document.getElementById('codeSection');
        const teacherSelect = document.getElementById('codeTeacherSelect');
        if (!sectionSelect || !teacherSelect) return;

        const sectionIndex = parseInt(sectionSelect.value);
        const currentValue = teacherSelect.value;
        let options = '<option value=""> ...</option>';

        if (!isNaN(sectionIndex) && sectionIndex >= 0 && data.sections[sectionIndex]) {
            data.sections[sectionIndex].teachers.forEach((t, i) => {
                options += `<option value="${i}">${t.name}</option>`;
            });
        }

        teacherSelect.innerHTML = options;
        if (currentValue && !isNaN(sectionIndex) && sectionIndex >= 0 &&
            data.sections[sectionIndex]?.teachers[parseInt(currentValue)]) {
            teacherSelect.value = currentValue;
        }
    }

    function updateEditTeacherData() {
        const sectionSelect = document.getElementById('editTeacherSection');
        const teacherSelect = document.getElementById('editTeacherSelect');

        if (!sectionSelect || !teacherSelect) return;

        const sectionIndex = parseInt(sectionSelect.value);
        const teacherIndex = parseInt(teacherSelect.value);

        if (isNaN(sectionIndex) || sectionIndex < 0 || isNaN(teacherIndex) || teacherIndex < 0 ||
            !data.sections[sectionIndex]?.teachers[teacherIndex]) {
            document.getElementById('editTeacherName').value = '';
            document.getElementById('editTeacherSubject').value = '';
            document.getElementById('editTeacherDesc').value = '';
            document.getElementById('editTeacherImage').value = '';
            return;
        }

        const teacher = data.sections[sectionIndex].teachers[teacherIndex];
        document.getElementById('editTeacherName').value = teacher.name || '';
        document.getElementById('editTeacherSubject').value = teacher.subject || '';
        document.getElementById('editTeacherDesc').value = teacher.description || '';
        document.getElementById('editTeacherImage').value = teacher.image || '';
        document.getElementById('editTeacherMessage').innerHTML = '';
    }

    function updatePendingChanges() {
        if (pendingChangesSpan) pendingChangesSpan.textContent = pendingChanges;
    }

    function addChange() {
        pendingChanges++;
        updatePendingChanges();
    }

    // ============================================================
    // =====   =====
    // ============================================================
    addSectionForm?.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('sectionName').value.trim();

        if (!name) {
            showToast('warning', '    ');
            return;
        }

        const newSection = {
            id: 'sec-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
            name: name,
            teachers: []
        };

        data.sections.push(newSection);
        saveData();
        renderAllData();
        updateAllAdminSelects();
        addChange();
        addSectionForm.reset();
        showToast('success', `    "${name}" `);
        adminPanel.classList.add('active');
    });

    // ============================================================
    // =====   =====
    // ============================================================
    addTeacherForm?.addEventListener('submit', function(e) {
        e.preventDefault();
        const sectionSelect = document.getElementById('teacherSection');
        const sectionIndex = parseInt(sectionSelect?.value);

        if (isNaN(sectionIndex) || sectionIndex < 0) {
            showToast('warning', '   ');
            return;
        }

        const name = document.getElementById('teacherName').value.trim();
        const emoji = document.getElementById('teacherEmoji').value.trim() || '';
        const subject = document.getElementById('teacherSubject').value.trim();
        const description = document.getElementById('teacherDesc').value.trim();
        const image = document.getElementById('teacherImage').value.trim();

        if (!name) {
            showToast('warning', '    ');
            return;
        }

        const newTeacher = {
            name,
            emoji,
            subject: subject || '',
            description: description || '',
            image: image || '',
            codes: [],
            semesters: []
        };

        data.sections[sectionIndex].teachers.push(newTeacher);
        saveData();
        renderAllData();
        updateAllAdminSelects();
        addChange();
        addTeacherForm.reset();
        showToast('success', `    "${name}" `);
        adminPanel.classList.add('active');
    });

    // ============================================================
    // =====   =====
    // ============================================================
    addSemesterForm?.addEventListener('submit', function(e) {
        e.preventDefault();
        const sectionSelect = document.getElementById('semesterSection');
        const teacherSelect = document.getElementById('semesterTeacher');
        const sectionIndex = parseInt(sectionSelect?.value);
        const teacherIndex = parseInt(teacherSelect?.value);
        const number = parseInt(document.getElementById('semesterNumber').value);
        const description = document.getElementById('semesterDesc').value.trim();

        if (isNaN(sectionIndex) || sectionIndex < 0 || isNaN(teacherIndex) || teacherIndex < 0 || !number) {
            showToast('warning', '       ');
            return;
        }

        const newSemester = {
            number: number,
            description: description || ` ${number}`,
            lectures: []
        };

        data.sections[sectionIndex].teachers[teacherIndex].semesters.push(newSemester);
        saveData();
        renderAllData();
        updateAllAdminSelects();
        addChange();
        addSemesterForm.reset();
        showToast('success', `    ${number} `);
        adminPanel.classList.add('active');
    });

    // ============================================================
    // =====   =====
    // ============================================================
    addLectureForm?.addEventListener('submit', function(e) {
        e.preventDefault();
        const sectionSelect = document.getElementById('lectureSection');
        const teacherSelect = document.getElementById('lectureTeacher');
        const semesterSelect = document.getElementById('lectureSemester');

        const sectionIndex = parseInt(sectionSelect?.value);
        const teacherIndex = parseInt(teacherSelect?.value);
        const semesterIndex = parseInt(semesterSelect?.value);
        const number = parseInt(document.getElementById('lectureNumber').value);
        const title = document.getElementById('lectureTitle').value.trim();
        const youtubeUrl = document.getElementById('lectureUrl').value.trim();
        const isFree = document.getElementById('lectureFree').value === 'true';

        if (isNaN(sectionIndex) || sectionIndex < 0 || isNaN(teacherIndex) || teacherIndex < 0 ||
            isNaN(semesterIndex) || semesterIndex < 0 || !number || !title || !youtubeUrl) {
            showToast('warning', '     ');
            return;
        }

        const isValidUrl = youtubeUrl.includes('mediadelivery') ||
            youtubeUrl.includes('youtube') ||
            youtubeUrl.includes('youtu.be') ||
            youtubeUrl.includes('player.') ||
            youtubeUrl.match(/\.(mp4|webm|ogg|m3u8)(\?.*)?$/i);

        if (!isValidUrl) {
            showToast('warning', '    .   mediadelivery  YouTube');
            return;
        }

        const newLecture = { number, title, youtubeUrl, isFree };
        data.sections[sectionIndex].teachers[teacherIndex].semesters[semesterIndex].lectures.push(newLecture);
        saveData();
        renderAllData();
        updateAllAdminSelects();
        addChange();
        addLectureForm.reset();
        showToast('success', `    "${title}" `);
        adminPanel.classList.add('active');
    });

    // ============================================================
    // =====   =====
    // ============================================================
    window.addManualCode = function() {
        const sectionSelect = document.getElementById('codeSection');
        const teacherSelect = document.getElementById('codeTeacherSelect');
        const codeInput = document.getElementById('manualCodeInput');
        const codeMessage = document.getElementById('manualCodeMessage');

        const sectionIndex = parseInt(sectionSelect?.value);
        const teacherIndex = parseInt(teacherSelect?.value);
        const code = codeInput?.value.trim().toUpperCase();

        if (isNaN(sectionIndex) || sectionIndex < 0) {
            codeMessage.innerHTML = '    ';
            codeMessage.style.color = '#f59e0b';
            return;
        }

        if (isNaN(teacherIndex) || teacherIndex < 0) {
            codeMessage.innerHTML = '    ';
            codeMessage.style.color = '#f59e0b';
            return;
        }

        if (!code) {
            codeMessage.innerHTML = '   ';
            codeMessage.style.color = '#f59e0b';
            return;
        }

        if (code.length < 4) {
            codeMessage.innerHTML = '   ';
            codeMessage.style.color = '#f59e0b';
            return;
        }

        const teacher = data.sections[sectionIndex].teachers[teacherIndex];
        if (!teacher) {
            codeMessage.innerHTML = '   ';
            codeMessage.style.color = '#ef4444';
            return;
        }

        if (!teacher.codes) teacher.codes = [];
        const exists = teacher.codes.some(c => c.code === code);
        if (exists) {
            codeMessage.innerHTML = '    ';
            codeMessage.style.color = '#f59e0b';
            return;
        }

        teacher.codes.push({
            code: code,
            used: false,
            locked: false,
            deviceId: null,
            userId: null,
            userEmail: null,
            usedAt: null
        });

        saveData();
        addChange();
        updateCodesManagement();
        if (codeInput) codeInput.value = '';
        codeMessage.innerHTML = `   : ${code}`;
        codeMessage.style.color = '#22c55e';
        showToast('success', `   : ${code}`);
        updateAllAdminSelects();
    };

    window.generateCodes = function(count = 5) {
        const sectionSelect = document.getElementById('codeSection');
        const teacherSelect = document.getElementById('codeTeacherSelect');
        const sectionIndex = parseInt(sectionSelect?.value);
        const teacherIndex = parseInt(teacherSelect?.value);

        if (isNaN(sectionIndex) || sectionIndex < 0) {
            showToast('warning', '    ');
            return;
        }

        if (isNaN(teacherIndex) || teacherIndex < 0) {
            showToast('warning', '    ');
            return;
        }

        const teacher = data.sections[sectionIndex].teachers[teacherIndex];
        if (!teacher) { showToast('error', '   '); return; }

        if (!teacher.codes) teacher.codes = [];
        const newCodes = [];

        for (let i = 0; i < count; i++) {
            const prefix = teacher.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let random = '';
            for (let j = 0; j < 8; j++) {
                random += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            const newCode = `${prefix}-${random}`;
            teacher.codes.push({
                code: newCode,
                used: false,
                locked: false,
                deviceId: null,
                userId: null,
                userEmail: null,
                usedAt: null
            });
            newCodes.push(newCode);
        }

        saveData();
        addChange();
        updateCodesManagement();
        showToast('success', `   ${newCodes.length}  `);
        updateAllAdminSelects();
    };

    function updateCodesManagement() {
        const sectionSelect = document.getElementById('codeSection');
        const teacherSelect = document.getElementById('codeTeacherSelect');
        const container = document.getElementById('codesListContainer');

        const sectionIndex = parseInt(sectionSelect?.value);
        const teacherIndex = parseInt(teacherSelect?.value);

        if (isNaN(sectionIndex) || sectionIndex < 0) {
            container.innerHTML = '<p style="color:var(--text-light);text-align:center;padding:1rem 0;">  </p>';
            return;
        }

        if (isNaN(teacherIndex) || teacherIndex < 0) {
            container.innerHTML = '<p style="color:var(--text-light);text-align:center;padding:1rem 0;">  </p>';
            return;
        }

        const teacher = data.sections[sectionIndex]?.teachers[teacherIndex];
        if (!teacher) {
            container.innerHTML = '<p style="color:var(--text-light);text-align:center;padding:1rem 0;">  </p>';
            return;
        }

        const status = getCodesStatus(teacher);
        let html = `
            <div class="codes-stats">
                <span> : ${status.total}</span>
                <span> : ${status.used}</span>
                <span> : ${status.available}</span>
                <span> : ${status.locked}</span>
            </div>
            <div class="codes-table-wrapper">
                <table class="codes-table">
                    <thead><tr><th>#</th><th></th><th></th><th> </th><th></th></tr></thead>
                    <tbody>
        `;

        if (teacher.codes && teacher.codes.length > 0) {
            teacher.codes.forEach((c, index) => {
                const isUsed = c.used;
                const isLocked = c.locked || false;
                const isMyCode = c.userEmail === currentUser?.email;
                let statusText = '', statusColor = '#22c55e', usedAtDisplay = '';

                if (isLocked) { statusText = ' ';
                    statusColor = '#f59e0b'; } else if (isUsed) {
                    statusText = isMyCode ? ' ' : ' ';
                    statusColor = isMyCode ? '#22c55e' : '#ef4444';
                    usedAtDisplay = c.usedAt ? new Date(c.usedAt).toLocaleString('ar') : ' ';
                } else { statusText = ' ';
                    statusColor = '#22c55e'; }

                html += `
                    <tr>
                        <td>${index + 1}</td>
                        <td><code style="font-weight:700;color:${statusColor};">${c.code}</code></td>
                        <td><span style="color:${statusColor};">${statusText}</span></td>
                        <td style="font-size:0.7rem;color:var(--text-light);">${usedAtDisplay}</td>
                        <td>
                            <button onclick="toggleCodeLock('${sectionIndex}', '${teacherIndex}', '${c.code}')" style="background:${isLocked ? '#22c55e' : '#f59e0b'};color:white;border:none;border-radius:4px;padding:0.15rem 0.5rem;cursor:pointer;font-size:0.7rem;">
                                ${isLocked ? ' ' : ' '}
                            </button>
                            ${!isUsed && !isLocked ? `<button onclick="deleteCodeAction('${sectionIndex}', '${teacherIndex}', '${c.code}')" style="background:#ef4444;color:white;border:none;border-radius:4px;padding:0.15rem 0.5rem;cursor:pointer;font-size:0.7rem;"></button>` : ''}
                        </td>
                    </tr>
                `;
            });
        } else {
            html += `<tr><td colspan="5" style="text-align:center;color:var(--text-light);padding:1rem 0;">  </td></tr>`;
        }

        html += `</tbody></table></div>`;
        container.innerHTML = html;
    }

    window.toggleCodeLock = function(sectionIndex, teacherIndex, code) {
        const teacher = data.sections[sectionIndex]?.teachers[teacherIndex];
        if (!teacher) { showToast('error', '   '); return; }

        const codeData = teacher.codes.find(c => c.code === code);
        if (!codeData) { showToast('error', '   '); return; }

        codeData.locked = !codeData.locked;
        saveData();
        addChange();
        updateCodesManagement();
        showToast('success', `  ${codeData.locked ? '' : ''}  ${code}`);
    };

    window.deleteCodeAction = function(sectionIndex, teacherIndex, code) {
        if (!confirm(`      : ${code}`)) return;

        const teacher = data.sections[sectionIndex]?.teachers[teacherIndex];
        if (!teacher) { showToast('error', '   '); return; }

        const index = teacher.codes.findIndex(c => c.code === code);
        if (index === -1) { showToast('error', '   '); return; }

        if (teacher.codes[index].used) {
            showToast('warning', '     ');
            return;
        }

        teacher.codes.splice(index, 1);
        saveData();
        addChange();
        updateCodesManagement();
        showToast('success', `   : ${code}`);
    };

    // ============================================================
    // ===== EDIT TEACHER =====
    // ============================================================
    document.getElementById('editTeacherSection')?.addEventListener('change', function() {
        updateAllAdminSelects();
    });

    document.getElementById('editTeacherSelect')?.addEventListener('change', function() {
        updateEditTeacherData();
    });

    editTeacherForm?.addEventListener('submit', function(e) {
        e.preventDefault();

        const sectionSelect = document.getElementById('editTeacherSection');
        const teacherSelect = document.getElementById('editTeacherSelect');
        const messageEl = document.getElementById('editTeacherMessage');

        const sectionIndex = parseInt(sectionSelect?.value);
        const teacherIndex = parseInt(teacherSelect?.value);

        if (isNaN(sectionIndex) || sectionIndex < 0) {
            messageEl.innerHTML = '   ';
            messageEl.style.color = '#f59e0b';
            return;
        }

        if (isNaN(teacherIndex) || teacherIndex < 0) {
            messageEl.innerHTML = '   ';
            messageEl.style.color = '#f59e0b';
            return;
        }

        const teacher = data.sections[sectionIndex].teachers[teacherIndex];
        if (!teacher) {
            messageEl.innerHTML = '   ';
            messageEl.style.color = '#ef4444';
            return;
        }

        const newName = document.getElementById('editTeacherName').value.trim();
        const newSubject = document.getElementById('editTeacherSubject').value.trim();
        const newDesc = document.getElementById('editTeacherDesc').value.trim();
        const newImage = document.getElementById('editTeacherImage').value.trim();

        if (!newName) {
            messageEl.innerHTML = '    ';
            messageEl.style.color = '#f59e0b';
            return;
        }

        teacher.name = newName;
        teacher.subject = newSubject || '';
        teacher.description = newDesc || '';
        teacher.image = newImage || '';

        saveData();
        renderAllData();
        updateAllAdminSelects();
        addChange();

        messageEl.innerHTML = `     "${newName}" !`;
        messageEl.style.color = '#22c55e';
        showToast('success', `     "${newName}"`);
    });

    // ============================================================
    // ===== DELETE FUNCTIONS =====
    // ============================================================

    window.deleteSelectedSection = function() {
        const select = document.getElementById('deleteSection');
        const sectionIndex = parseInt(select?.value);

        if (isNaN(sectionIndex) || sectionIndex < 0) {
            showToast('warning', '   ');
            return;
        }

        const section = data.sections[sectionIndex];
        if (!section) { showToast('error', '   '); return; }

        if (!confirm(`       "${section.name}"  `)) return;

        data.sections.splice(sectionIndex, 1);
        saveData();
        renderAllData();
        updateAllAdminSelects();
        addChange();

        const msg = document.getElementById('deleteSectionMessage');
        if (msg) { msg.innerHTML = `    "${section.name}" `;
            msg.style.color = '#22c55e'; }
        showToast('success', `    "${section.name}"`);
    };

    window.deleteSelectedTeacherFromTab = function() {
        const sectionSelect = document.getElementById('deleteTeacherSection');
        const teacherSelect = document.getElementById('deleteTeacherSelect');
        const sectionIndex = parseInt(sectionSelect?.value);
        const teacherIndex = parseInt(teacherSelect?.value);

        if (isNaN(sectionIndex) || sectionIndex < 0) {
            showToast('warning', '   ');
            return;
        }

        if (isNaN(teacherIndex) || teacherIndex < 0) {
            showToast('warning', '   ');
            return;
        }

        const teacher = data.sections[sectionIndex].teachers[teacherIndex];
        if (!teacher) { showToast('error', '   '); return; }

        if (!confirm(`       "${teacher.name}"`)) return;

        data.sections[sectionIndex].teachers.splice(teacherIndex, 1);
        saveData();
        renderAllData();
        updateAllAdminSelects();
        addChange();

        const msg = document.getElementById('deleteTeacherMessage');
        if (msg) { msg.innerHTML = `    "${teacher.name}" `;
            msg.style.color = '#22c55e'; }
        showToast('success', `    "${teacher.name}"`);
    };

    window.deleteSelectedSemesterFromTab = function() {
        const sectionSelect = document.getElementById('deleteSemesterSection');
        const teacherSelect = document.getElementById('deleteSemesterTeacher');
        const semesterSelect = document.getElementById('deleteSemesterSelect');

        const sectionIndex = parseInt(sectionSelect?.value);
        const teacherIndex = parseInt(teacherSelect?.value);
        const semesterIndex = parseInt(semesterSelect?.value);

        if (isNaN(sectionIndex) || sectionIndex < 0) {
            showToast('warning', '   ');
            return;
        }

        if (isNaN(teacherIndex) || teacherIndex < 0) {
            showToast('warning', '   ');
            return;
        }

        if (isNaN(semesterIndex) || semesterIndex < 0) {
            showToast('warning', '   ');
            return;
        }

        const semester = data.sections[sectionIndex].teachers[teacherIndex]?.semesters[semesterIndex];
        if (!semester) { showToast('error', '   '); return; }

        if (!confirm(`       ${semester.number}`)) return;

        data.sections[sectionIndex].teachers[teacherIndex].semesters.splice(semesterIndex, 1);
        saveData();
        renderAllData();
        updateAllAdminSelects();
        addChange();

        const msg = document.getElementById('deleteSemesterMessage');
        if (msg) { msg.innerHTML = `    ${semester.number} `;
            msg.style.color = '#22c55e'; }
        showToast('success', `    ${semester.number}`);
        updateAllAdminSelects();
    };

    window.deleteSelectedLectureFromTab = function() {
        const sectionSelect = document.getElementById('deleteLectureSection');
        const teacherSelect = document.getElementById('deleteLectureTeacher');
        const semesterSelect = document.getElementById('deleteLectureSemester');
        const lectureSelect = document.getElementById('deleteLectureSelect');

        const sectionIndex = parseInt(sectionSelect?.value);
        const teacherIndex = parseInt(teacherSelect?.value);
        const semesterIndex = parseInt(semesterSelect?.value);
        const lectureIndex = parseInt(lectureSelect?.value);

        if (isNaN(sectionIndex) || sectionIndex < 0) {
            showToast('warning', '   ');
            return;
        }

        if (isNaN(teacherIndex) || teacherIndex < 0) {
            showToast('warning', '   ');
            return;
        }

        if (isNaN(semesterIndex) || semesterIndex < 0) {
            showToast('warning', '   ');
            return;
        }

        if (isNaN(lectureIndex) || lectureIndex < 0) {
            showToast('warning', '   ');
            return;
        }

        const lecture = data.sections[sectionIndex].teachers[teacherIndex]?.semesters[semesterIndex]?.lectures[lectureIndex];
        if (!lecture) { showToast('error', '   '); return; }

        if (!confirm(`       "${lecture.title}"`)) return;

        data.sections[sectionIndex].teachers[teacherIndex].semesters[semesterIndex].lectures.splice(lectureIndex, 1);
        saveData();
        renderAllData();
        updateAllAdminSelects();
        addChange();

        const msg = document.getElementById('deleteLectureMessage');
        if (msg) { msg.innerHTML = `    "${lecture.title}" `;
            msg.style.color = '#22c55e'; }
        showToast('success', `    "${lecture.title}"`);
        updateAllAdminSelects();
    };

    // ============================================================
    // ===== EDIT LECTURE =====
    // ============================================================
    function openEditLecture(sectionIndex, teacherIndex, semesterIndex, lectureIndex) {
        const section = data.sections[sectionIndex];
        if (!section) return;
        const teacher = section.teachers[teacherIndex];
        if (!teacher) return;
        const semester = teacher.semesters[semesterIndex];
        if (!semester) return;
        const lecture = semester.lectures[lectureIndex];
        if (!lecture) return;

        editTarget = { sectionIndex, teacherIndex, semesterIndex, lectureIndex };
        editLectureTitle.value = lecture.title || '';
        editLectureUrl.value = lecture.youtubeUrl || '';
        editLectureIsFree.value = lecture.isFree ? 'true' : 'false';

        document.querySelector('#editLectureModal h2').textContent = `   #${lecture.number}`;
        const infoSpan = document.getElementById('editLectureInfo');
        infoSpan.textContent = ` ${section.name} |  ${teacher.name} |   ${semester.number}`;
        editLectureMessage.innerHTML = '';
        editLectureModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    window.openEditLectureFromAdmin = function() {
        const sectionSelect = document.getElementById('editLectureSection');
        const teacherSelect = document.getElementById('editLectureTeacher');
        const semesterSelect = document.getElementById('editLectureSemester');
        const lectureSelect = document.getElementById('editLectureSelect');
        const messageEl = document.getElementById('editLectureAdminMessage');

        const sectionIndex = parseInt(sectionSelect?.value);
        const teacherIndex = parseInt(teacherSelect?.value);
        const semesterIndex = parseInt(semesterSelect?.value);
        const lectureIndex = parseInt(lectureSelect?.value);

        if (isNaN(sectionIndex) || sectionIndex < 0) {
            messageEl.innerHTML = '   ';
            messageEl.style.color = '#f59e0b';
            return;
        }

        if (isNaN(teacherIndex) || teacherIndex < 0) {
            messageEl.innerHTML = '   ';
            messageEl.style.color = '#f59e0b';
            return;
        }

        if (isNaN(semesterIndex) || semesterIndex < 0) {
            messageEl.innerHTML = '   ';
            messageEl.style.color = '#f59e0b';
            return;
        }

        if (isNaN(lectureIndex) || lectureIndex < 0) {
            messageEl.innerHTML = '   ';
            messageEl.style.color = '#f59e0b';
            return;
        }

        const lecture = data.sections[sectionIndex]?.teachers[teacherIndex]?.semesters[semesterIndex]?.lectures[lectureIndex];
        if (!lecture) {
            messageEl.innerHTML = '   ';
            messageEl.style.color = '#ef4444';
            return;
        }

        messageEl.innerHTML = '';
        openEditLecture(sectionIndex, teacherIndex, semesterIndex, lectureIndex);
    };

    editLectureForm?.addEventListener('submit', function(e) {
        e.preventDefault();

        const { sectionIndex, teacherIndex, semesterIndex, lectureIndex } = editTarget;

        if (sectionIndex === -1 || teacherIndex === -1 || semesterIndex === -1 || lectureIndex === -1) {
            editLectureMessage.innerHTML = '      ';
            editLectureMessage.style.color = '#f59e0b';
            return;
        }

        const newTitle = editLectureTitle.value.trim();
        const newUrl = editLectureUrl.value.trim();
        const newIsFree = editLectureIsFree.value === 'true';

        if (!newTitle) {
            editLectureMessage.innerHTML = '    ';
            editLectureMessage.style.color = '#f59e0b';
            return;
        }

        if (!newUrl) {
            editLectureMessage.innerHTML = '    ';
            editLectureMessage.style.color = '#f59e0b';
            return;
        }

        const isValidUrl = newUrl.includes('mediadelivery') ||
            newUrl.includes('youtube') ||
            newUrl.includes('youtu.be') ||
            newUrl.includes('player.') ||
            newUrl.match(/\.(mp4|webm|ogg|m3u8)(\?.*)?$/i);

        if (!isValidUrl) {
            editLectureMessage.innerHTML = '    .   mediadelivery  YouTube';
            editLectureMessage.style.color = '#f59e0b';
            return;
        }

        const lecture = data.sections[sectionIndex]?.teachers[teacherIndex]?.semesters[semesterIndex]?.lectures[lectureIndex];
        if (!lecture) {
            editLectureMessage.innerHTML = '   ';
            editLectureMessage.style.color = '#ef4444';
            return;
        }

        lecture.title = newTitle;
        lecture.youtubeUrl = newUrl;
        lecture.isFree = newIsFree;

        saveData();
        renderAllData();
        addChange();

        editLectureMessage.innerHTML = '    !';
        editLectureMessage.style.color = '#22c55e';
        showToast('success', `    "${newTitle}" `);

        setTimeout(() => { closeEditLectureModal(); }, 1200);
    });

    function closeEditLectureModal() {
        editLectureModal.classList.remove('active');
        document.body.style.overflow = 'auto';
        editTarget = { sectionIndex: -1, teacherIndex: -1, semesterIndex: -1, lectureIndex: -1 };
        if (editLectureMessage) editLectureMessage.innerHTML = '';
    }

    closeEditLecture?.addEventListener('click', closeEditLectureModal);
    cancelEditLecture?.addEventListener('click', closeEditLectureModal);
    editLectureModal?.addEventListener('click', function(e) {
        if (e.target === this) closeEditLectureModal();
    });

    // ============================================================
    // ===== ADMIN MANAGEMENT =====
    // ============================================================

    window.addNewAdmin = async function() {
        const emailInput = document.getElementById('adminEmailInput');
        const messageEl = document.getElementById('addAdminMessage');
        const email = emailInput.value.trim();

        if (!email) {
            messageEl.innerHTML = '    ';
            messageEl.style.color = '#f59e0b';
            return;
        }

        if (!email.includes('@') || !email.includes('.')) {
            messageEl.innerHTML = '    ';
            messageEl.style.color = '#f59e0b';
            return;
        }

        if (!supabaseClient) {
            messageEl.innerHTML = ' Supabase  ';
            messageEl.style.color = '#ef4444';
            return;
        }

        try {
            let { data: userData, error: userError } = await supabaseClient
                .from('users')
                .select('id, email')
                .eq('email', email)
                .maybeSingle();

            if (!userData) {
                messageEl.innerHTML = `
                      <strong>${email}</strong>      .
                    <br><br>
                    <button onclick="fixUserAndAddAdmin('${email}')" style="background:var(--primary);color:white;border:none;padding:0.4rem 1rem;border-radius:8px;cursor:pointer;font-weight:600;">
                        <i class="fas fa-sync"></i>    
                    </button>
                `;
                messageEl.style.color = '#f59e0b';
                return;
            }

            const { data: existingAdmin, error: checkError } = await supabaseClient
                .from('admins')
                .select('email')
                .eq('email', email)
                .maybeSingle();

            if (existingAdmin) {
                messageEl.innerHTML = '    ';
                messageEl.style.color = '#f59e0b';
                return;
            }

            const { error: insertError } = await supabaseClient
                .from('admins')
                .insert({ uid: userData.id, email: email, role: 'admin' });

            if (insertError) {
                messageEl.innerHTML = '   : ' + insertError.message;
                messageEl.style.color = '#ef4444';
                return;
            }

            messageEl.innerHTML = `   : ${email} !`;
            messageEl.style.color = '#22c55e';
            emailInput.value = '';
            showToast('success', `   : ${email}`);
            loadAdminsList();

        } catch (error) {
            messageEl.innerHTML = '  : ' + error.message;
            messageEl.style.color = '#ef4444';
            console.error('Error adding admin:', error);
        }
    };

    window.fixUserAndAddAdmin = async function(email) {
        const messageEl = document.getElementById('addAdminMessage');

        if (!supabaseClient) {
            messageEl.innerHTML = ' Supabase  ';
            messageEl.style.color = '#ef4444';
            return;
        }

        try {
            const { data: result, error: rpcError } = await supabaseClient
                .rpc('add_user_and_admin', { p_email: email });

            if (rpcError) {
                messageEl.innerHTML = `
                       : ${rpcError.message}
                    <br><br>
                    <button onclick="copyRpcFunction()" style="background:var(--primary);color:white;border:none;padding:0.4rem 1rem;border-radius:8px;cursor:pointer;font-weight:600;">
                        <i class="fas fa-copy"></i>   
                    </button>
                `;
                messageEl.style.color = '#ef4444';
                return;
            }

            if (result && result.success) {
                messageEl.innerHTML = `      <strong>${email}</strong>  !`;
                messageEl.style.color = '#22c55e';
                showToast('success', `     : ${email}`);
                loadAdminsList();
            } else {
                messageEl.innerHTML = ' ' + (result?.message || '   ');
                messageEl.style.color = '#ef4444';
            }

        } catch (error) {
            messageEl.innerHTML = '  : ' + error.message;
            messageEl.style.color = '#ef4444';
            console.error('Error fixing user:', error);
        }
    };

    window.copyRpcFunction = function() {
        const sql = `
create or replace function add_user_and_admin(p_email text)
returns jsonb language plpgsql security definer as $$
declare
    v_user_id uuid;
    v_result jsonb;
begin
    select id into v_user_id from public.users where email = p_email;
    if v_user_id is null then
        v_user_id := gen_random_uuid();
        insert into public.users (id, email, full_name, registered_at)
        values (v_user_id, p_email, split_part(p_email, '@', 1), now());
    end if;
    insert into public.admins (uid, email, role)
    values (v_user_id, p_email, 'admin')
    on conflict (uid) do nothing;
    v_result := jsonb_build_object(
        'success', true,
        'message', '    ',
        'user_id', v_user_id::text,
        'email', p_email
    );
    return v_result;
exception when others then
    return jsonb_build_object(
        'success', false,
        'message', ' : ' || sqlerrm
    );
end;
$$;
grant execute on function add_user_and_admin(text) to authenticated;
        `;

        navigator.clipboard.writeText(sql).then(() => {
            showToast('success', '     RPC');
        }).catch(() => {
            const textarea = document.createElement('textarea');
            textarea.value = sql;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showToast('success', '     RPC');
        });
    };

    async function loadAdminsList() {
        const container = document.getElementById('adminsListContainer');
        if (!container) return;

        if (!supabaseClient) {
            container.innerHTML = '<p style="color:var(--text-light);text-align:center;"> Supabase  </p>';
            return;
        }

        try {
            const { data: admins, error } = await supabaseClient
                .from('admins')
                .select('email, uid, created_at')
                .order('created_at', { ascending: true });

            if (error) {
                container.innerHTML = '<p style="color:var(--text-light);text-align:center;">   </p>';
                return;
            }

            if (!admins || admins.length === 0) {
                container.innerHTML = '<p style="color:var(--text-light);text-align:center;">    </p>';
                return;
            }

            let html = `
                <div style="overflow-x:auto;">
                    <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
                        <thead>
                            <tr style="background:var(--primary-gradient);color:white;">
                                <th style="padding:0.5rem;text-align:right;">#</th>
                                <th style="padding:0.5rem;text-align:right;"> </th>
                                <th style="padding:0.5rem;text-align:right;"> </th>
                                <th style="padding:0.5rem;text-align:center;"></th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            admins.forEach((admin, index) => {
                const isCurrentUser = admin.email === currentUser?.email;
                const createdAt = admin.created_at ? new Date(admin.created_at).toLocaleDateString('ar') : ' ';

                html += `
                    <tr style="border-bottom:1px solid var(--border);">
                        <td style="padding:0.4rem 0.5rem;">${index + 1}</td>
                        <td style="padding:0.4rem 0.5rem;">${admin.email} ${isCurrentUser ? ' ()' : ''}</td>
                        <td style="padding:0.4rem 0.5rem;color:var(--text-light);font-size:0.75rem;">${createdAt}</td>
                        <td style="padding:0.4rem 0.5rem;text-align:center;">
                            ${!isCurrentUser ? `<button onclick="deleteAdmin('${admin.email}')" class="btn-delete-admin"> </button>` : '<span style="color:var(--text-light);font-size:0.7rem;">   </span>'}
                        </td>
                    </tr>
                `;
            });

            html += `</tbody></table></div>`;
            container.innerHTML = html;

        } catch (error) {
            container.innerHTML = '<p style="color:var(--text-light);text-align:center;">   </p>';
            console.error('Error loading admins:', error);
        }
    }

    window.deleteAdmin = async function(email) {
        if (!confirm(`      : ${email}`)) return;

        if (!supabaseClient) {
            showToast('error', ' Supabase  ');
            return;
        }

        try {
            const { error } = await supabaseClient
                .from('admins')
                .delete()
                .eq('email', email);

            if (error) {
                showToast('error', '   : ' + error.message);
                return;
            }

            showToast('success', `   : ${email}`);
            loadAdminsList();

        } catch (error) {
            showToast('error', '  : ' + error.message);
            console.error('Error deleting admin:', error);
        }
    };

    // ============================================================
    // ===== PUBLISH =====
    // ============================================================
    publishBtn?.addEventListener('click', async function() {
        if (pendingChanges === 0) {
            showToast('info', '    ');
            return;
        }

        if (!supabaseClient) {
            showToast('error', ' Supabase  ');
            return;
        }

        if (!ADMIN_EMAILS.includes(currentUser?.email)) {
            const isAdmin = await isUserAdmin(currentUser?.email);
            if (!isAdmin) {
                showToast('error', '    ');
                return;
            }
        }

        const result = await saveSupabaseAcademyData();
        if (!result.success) {
            showToast('error', '  : ' + (result.error?.message || '  '));
            return;
        }

        pendingChanges = 0;
        updatePendingChanges();
        showToast('success', '    ');

        const msg = document.getElementById('publishMessage');
        if (msg) { msg.textContent = '    ';
            msg.style.color = '#22c55e'; }
        setTimeout(() => { if (msg) msg.textContent = ''; }, 5000);
    });

    createTableBtn?.addEventListener('click', async function() {
        const sql =
            `create table if not exists academy_data (\n  id text primary key,\n  content jsonb not null,\n  inserted_at timestamptz not null default now(),\n  updated_at timestamptz not null default now()\n);`;
        try {
            await navigator.clipboard.writeText(sql);
            showToast('info', '   SQL  ');
        } catch (err) {
            showToast('error', '   SQL');
        }
    });

    // ============================================================
    // ===== USERS TABLE =====
    // ============================================================
    function renderUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        const usersMap = new Map();

        data.sections.forEach(section => {
            section.teachers.forEach(teacher => {
                if (teacher.codes) {
                    teacher.codes.forEach(c => {
                        if (c.used && c.userEmail) {
                            if (!usersMap.has(c.userEmail)) {
                                usersMap.set(c.userEmail, {
                                    email: c.userEmail,
                                    userId: c.userId || ' ',
                                    courses: [],
                                    registeredAt: c.usedAt || new Date().toISOString()
                                });
                            }
                            if (!usersMap.get(c.userEmail).courses.includes(teacher.name)) {
                                usersMap.get(c.userEmail).courses.push(teacher.name);
                            }
                        }
                    });
                }
            });
        });

        if (usersMap.size === 0) {
            tbody.innerHTML =
                '<tr><td colspan="5" style="text-align:center;color:var(--text-light);">   </td></tr>';
            return;
        }

        let html = '';
        let index = 1;
        usersMap.forEach((user, email) => {
            const isAdmin = ADMIN_EMAILS.includes(email);
            html += `
                <tr>
                    <td>${index++}</td>
                    <td>${email}</td>
                    <td>${user.courses.join(' ')}</td>
                    <td>${new Date(user.registeredAt).toLocaleDateString('ar')}</td>
                    <td><span class="badge ${isAdmin ? 'admin' : 'user'}">${isAdmin ? '' : ''}</span></td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    }

    // ============================================================
    // ===== TAB EVENTS =====
    // ============================================================
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.getElementById('tab-' + this.dataset.tab).classList.add('active');

            if (this.dataset.tab === 'manage-codes') {
                updateAllAdminSelects();
                updateCodesManagement();
            }
            if (this.dataset.tab === 'delete') {
                updateAllAdminSelects();
            }
            if (this.dataset.tab === 'edit-lecture') {
                updateAllAdminSelects();
            }
            if (this.dataset.tab === 'users') {
                renderUsersTable();
            }
            if (this.dataset.tab === 'add-admin') {
                loadAdminsList();
            }
            if (this.dataset.tab === 'edit-teacher') {
                updateAllAdminSelects();
            }
            if (this.dataset.tab === 'contact-messages') {
                renderAllMessages();
            }
            if (this.dataset.tab === 'add-teacher' || this.dataset.tab === 'add-semester' ||
                this.dataset.tab === 'add-lecture' || this.dataset.tab === 'add-section') {
                updateAllAdminSelects();
            }
        });
    });

    // ============================================================
    // ===== EVENT LISTENERS FOR DEPENDENT SELECTS =====
    // ============================================================

    document.getElementById('teacherSection')?.addEventListener('change', function() {
        updateAllAdminSelects();
    });

    document.getElementById('semesterSection')?.addEventListener('change', function() {
        updateAllAdminSelects();
    });

    document.getElementById('lectureSection')?.addEventListener('change', function() {
        updateAllAdminSelects();
    });

    document.getElementById('codeSection')?.addEventListener('change', function() {
        updateAllAdminSelects();
    });

    document.getElementById('editTeacherSection')?.addEventListener('change', function() {
        updateAllAdminSelects();
    });

    document.getElementById('editLectureSection')?.addEventListener('change', function() {
        updateAllAdminSelects();
    });

    document.getElementById('deleteTeacherSection')?.addEventListener('change', function() {
        updateAllAdminSelects();
    });

    document.getElementById('deleteSemesterSection')?.addEventListener('change', function() {
        updateAllAdminSelects();
    });

    document.getElementById('deleteLectureSection')?.addEventListener('change', function() {
        updateAllAdminSelects();
    });

    document.getElementById('semesterTeacher')?.addEventListener('change', function() {
        updateAllAdminSelects();
    });

    document.getElementById('lectureTeacher')?.addEventListener('change', function() {
        updateAllAdminSelects();
    });

    document.getElementById('codeTeacherSelect')?.addEventListener('change', function() {
        updateCodesManagement();
    });

    document.getElementById('editTeacherSelect')?.addEventListener('change', function() {
        updateEditTeacherData();
    });

    document.getElementById('editLectureTeacher')?.addEventListener('change', function() {
        updateAllAdminSelects();
    });

    document.getElementById('deleteSemesterTeacher')?.addEventListener('change', function() {
        updateAllAdminSelects();
    });

    document.getElementById('deleteLectureTeacher')?.addEventListener('change', function() {
        updateAllAdminSelects();
    });

    document.getElementById('lectureSemester')?.addEventListener('change', function() {
        updateAllAdminSelects();
    });

    document.getElementById('editLectureSemester')?.addEventListener('change', function() {
        updateAllAdminSelects();
    });

    document.getElementById('deleteSemesterSelect')?.addEventListener('change', function() {
        updateAllAdminSelects();
    });

    document.getElementById('deleteLectureSemester')?.addEventListener('change', function() {
        updateAllAdminSelects();
    });

    // ============================================================
    // ===== NAVBAR SCROLL =====
    // ============================================================
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar?.classList.add('scrolled');
        } else {
            navbar?.classList.remove('scrolled');
        }
    });

    // ============================================================
    // ===== INIT =====
    // ============================================================
    const savedTheme = localStorage.getItem('devAcademicTheme');
    if (savedTheme === 'dark') {
        isDarkMode = true;
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    async function init() {
        if (supabaseClient) {
            try {
                const { data: { session } } = await supabaseClient.auth.getSession();
                if (session?.user) {
                    currentUser = session.user;
                    localStorage.setItem('devAcademicUser', JSON.stringify({
                        email: currentUser.email,
                        name: currentUser.user_metadata?.full_name || ''
                    }));
                    updateUI();
                    await loadUserCodesFromSupabase();
                    loadContactMessages();
                    renderAllData();
                    renderMyCourses();
                    renderAccount();
                    renderMyMessages();
                    renderContactTeachers();
                    renderAllMessages();
                    updateBadge();
                    updateContactBadge();

                    loadingScreen.style.display = 'none';
                    navbar.style.display = 'flex';
                    bottomNav.style.display = 'flex';
                    footer.style.display = 'block';

                    navigateTo('home');
                    showToast('success', '  ');
                    console.log(' :', currentUser.email);
                    console.log('  :', ADMIN_EMAILS);
                } else {
                    window.location.href = 'index.html';
                }
            } catch (error) {
                console.warn('Session check error:', error);
                window.location.href = 'index.html';
            }
        } else {
            window.location.href = 'index.html';
        }

        if (supabaseClient && currentUser) {
            try {
                const channel = supabaseClient
                    .channel('public:academy_data')
                    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'academy_data',
                        filter: 'id=eq.main' }, (payload) => {
                        if (!payload?.new?.content) return;
                        try {
                            const remoteData = payload.new.content;
                            if (JSON.stringify(remoteData) !== JSON.stringify(data)) {
                                data = remoteData;
                                normalizeDataStructure(data);
                                saveData();
                                renderAllData();
                                renderMyCourses();
                                renderAccount();
                                renderContactTeachers();
                                updateBadge();
                                showToast('info', '    ');
                            }
                        } catch (err) { console.warn('Realtime parse error:', err); }
                    })
                    .subscribe();
                console.log('    Supabase');
            } catch (error) {
                console.warn('Supabase realtime subscription failed:', error);
            }
        }

        renderUsersTable();
        updateAllAdminSelects();
        loadAdminsList();
        console.log('   -     ');
        console.log('    ');
        console.log('   mediadelivery ');
        console.log('       RPC');
        console.log('     ');
    }

    loadData().then(init).catch((error) => {
        console.error('Initialization failed:', error);
        window.location.href = 'index.html';
    });

})();