// ============================================================
// إعداد Supabase
// ============================================================
const supabaseUrl = 'https://hdtrnfpwyvaeziaiweck.supabase.co'
const supabaseKey = 'sb_publishable_XYiUfizde8-Z0yBjvZNsBw_q_LSXK7V'
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey)

// ============================================================
// المتغيرات العامة
// ============================================================
let currentUser = null
let allContent = []
let filteredContent = []
let notifications = []
let isAdmin = false
let isDarkMode = true

// ============================================================
// دوال التحقق من الجلسة
// ============================================================
async function checkSession() {
    try {
        // التحقق من الجلسة المخزنة
        const session = localStorage.getItem('devflix_session')
        if (session) {
            const { data, error } = await supabaseClient.auth.setSession(JSON.parse(session))
            if (!error && data.user) {
                currentUser = data.user
                return true
            }
        }

        // التحقق من الجلسة الحالية
        const { data: { user } } = await supabaseClient.auth.getUser()
        if (user) {
            currentUser = user
            return true
        }

        return false
    } catch (e) {
        return false
    }
}

// ============================================================
// دوال تحميل البيانات
// ============================================================
async function loadUserData() {
    if (!currentUser) return

    try {
        // جلب بيانات المستخدم من جدول users
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('email', currentUser.email)
            .single()

        if (data) {
            isAdmin = data.role === 'admin'
            currentUser.full_name = data.full_name || currentUser.user_metadata?.full_name || 'مستخدم'
        } else {
            currentUser.full_name = currentUser.user_metadata?.full_name || 'مستخدم'
        }

        updateUserUI()
    } catch (e) {
        console.error('خطأ في تحميل بيانات المستخدم:', e)
    }
}

async function loadContent() {
    try {
        const { data, error } = await supabaseClient
            .from('content')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error

        allContent = data || []
        filteredContent = allContent
        renderContent()
        updateStats()
    } catch (e) {
        console.error('خطأ في تحميل المحتوى:', e)
    }
}

async function loadNotifications() {
    if (!currentUser) return

    try {
        const { data, error } = await supabaseClient
            .from('notifications')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })

        if (error) throw error

        notifications = data || []
        updateNotificationBadge()
    } catch (e) {
        console.error('خطأ في تحميل الإشعارات:', e)
    }
}

// ============================================================
// دوال تحديث الواجهة
// ============================================================
function updateUserUI() {
    const name = currentUser?.full_name || 'مستخدم'
    const email = currentUser?.email || ''

    // تحديث جميع عناصر اسم المستخدم
    document.querySelectorAll('#userNameDisplay, #sidebarUserName, #welcomeName, #profileName').forEach(el => {
        if (el) el.textContent = name
    })

    document.querySelectorAll('#sidebarUserEmail, #profileEmail').forEach(el => {
        if (el) el.textContent = email
    })

    // تحديث الصور
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=E50914&color=fff&size=100`
    document.querySelectorAll('#userAvatar, #sidebarAvatar, #profileAvatar').forEach(el => {
        if (el) el.src = avatarUrl
    })

    // تحديث دور المستخدم
    const roleEl = document.getElementById('profileRole')
    if (roleEl) {
        roleEl.textContent = isAdmin ? '👑 مدير' : '👤 مستخدم'
    }

    // إظهار زر الإدارة للمدمن
    if (isAdmin) {
        const nav = document.querySelector('.sidebar-nav')
        if (nav && !document.getElementById('adminLink')) {
            const adminLink = document.createElement('a')
            adminLink.id = 'adminLink'
            adminLink.href = '#'
            adminLink.onclick = () => navigateTo('admin')
            adminLink.innerHTML = '<i class="fas fa-cog"></i> لوحة التحكم'
            nav.appendChild(adminLink)
        }
    }
}

function updateStats() {
    const films = allContent.filter(c => c.type === 'film').length
    const series = allContent.filter(c => c.type === 'series').length
    const cartoons = allContent.filter(c => c.type === 'cartoon').length

    const moviesEl = document.getElementById('moviesCount')
    const seriesEl = document.getElementById('seriesCount')
    const watchEl = document.getElementById('watchCount')

    if (moviesEl) moviesEl.textContent = films + cartoons
    if (seriesEl) seriesEl.textContent = series
    if (watchEl) watchEl.textContent = allContent.length

    // تحديث إحصائيات الملف الشخصي
    const profileMovies = document.getElementById('profileMovies')
    const profileSeries = document.getElementById('profileSeries')
    const profileWatched = document.getElementById('profileWatched')

    if (profileMovies) profileMovies.textContent = films + cartoons
    if (profileSeries) profileSeries.textContent = series
    if (profileWatched) profileWatched.textContent = allContent.length
}

function updateNotificationBadge() {
    const unread = notifications.filter(n => !n.is_read).length
    document.querySelectorAll('#notifBadge, #bottomNotifBadge').forEach(el => {
        if (el) {
            el.textContent = unread
            el.style.display = unread > 0 ? 'block' : 'none'
        }
    })
}

// ============================================================
// دوال عرض المحتوى
// ============================================================
function renderContent(filter = null) {
    const container = document.getElementById('contentSections')
    const loading = document.getElementById('loadingContent')

    if (!container) return

    let data = filter ? allContent.filter(c => c.type === filter) : allContent
    if (filteredContent.length > 0 && !filter) {
        data = filteredContent
    }

    // تصنيف المحتوى
    const films = data.filter(c => c.type === 'film')
    const series = data.filter(c => c.type === 'series')
    const cartoons = data.filter(c => c.type === 'cartoon')

    let html = ''

    // قسم الأفلام
    if (films.length > 0) {
        html += createSection('🎬 أفلام', 'film', films)
    }

    // قسم المسلسلات
    if (series.length > 0) {
        html += createSection('📺 مسلسلات', 'series', series)
    }

    // قسم الكرتون
    if (cartoons.length > 0) {
        html += createSection('🎨 كرتون', 'cartoon', cartoons)
    }

    if (!html) {
        html = `
            <div style="text-align:center;padding:60px 20px;color:var(--text-secondary);">
                <i class="fas fa-inbox" style="font-size:48px;margin-bottom:15px;display:block;color:var(--text-muted);"></i>
                <h3 style="font-size:20px;color:var(--text-primary);">لا يوجد محتوى</h3>
                <p>سيظهر هنا كل ما هو جديد</p>
            </div>
        `
    }

    container.innerHTML = html
    if (loading) loading.classList.add('hidden')
}

function createSection(title, type, items) {
    let cards = items.map(item => `
        <div class="content-card" onclick="playContent('${item.id}')">
            <img src="${item.thumbnail_url || 'https://via.placeholder.com/300x200/1a1a1a/666?text=No+Image'}" 
                 alt="${item.title}"
                 onerror="this.src='https://via.placeholder.com/300x200/1a1a1a/666?text=No+Image'">
            <div class="card-info">
                <h4>${item.title}</h4>
                <span class="card-type">
                    ${type === 'film' ? '🎬 فيلم' : type === 'series' ? '📺 مسلسل' : '🎨 كرتون'}
                </span>
            </div>
        </div>
    `).join('')

    return `
        <section class="content-section">
            <div class="section-header">
                <h2>${title}</h2>
                <a href="#" onclick="filterByType('${type}')">عرض الجميع <i class="fas fa-arrow-left"></i></a>
            </div>
            <div class="content-grid">${cards}</div>
        </section>
    `
}

// ============================================================
// دوال البحث والتصفية
// ============================================================
function handleSearch() {
    const query = document.getElementById('searchInput')?.value.trim().toLowerCase() || ''
    
    if (!query) {
        filteredContent = allContent
    } else {
        filteredContent = allContent.filter(item => 
            item.title.toLowerCase().includes(query) ||
            item.type.toLowerCase().includes(query)
        )
    }
    
    renderContent()
}

function filterByType(type) {
    const searchInput = document.getElementById('searchInput')
    if (searchInput) searchInput.value = ''
    filteredContent = allContent.filter(c => c.type === type)
    renderContent()
    
    // التمرير إلى الأعلى
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

function showAll(type) {
    filterByType(type)
}

// ============================================================
// دوال التنقل
// ============================================================
function navigateTo(page) {
    // تحديث الروابط النشطة
    document.querySelectorAll('.sidebar-nav a, .bottom-nav a').forEach(el => {
        el.classList.remove('active')
    })
    
    if (page === 'home') {
        filteredContent = allContent
        renderContent()
        const firstNav = document.querySelector('.sidebar-nav a:first-child')
        const firstBottom = document.querySelector('.bottom-nav a:first-child')
        if (firstNav) firstNav.classList.add('active')
        if (firstBottom) firstBottom.classList.add('active')
    }
    
    // إغلاق القائمة الجانبية في الجوال
    closeSidebar()
}

// ============================================================
// دوال تشغيل المحتوى
// ============================================================
function playContent(id) {
    const item = allContent.find(c => c.id === id)
    if (!item) return

    // هنا يمكن فتح صفحة تشغيل الفيديو
    alert(`🎬 تشغيل: ${item.title}\n\nنوع: ${item.type}\n\nهنا سيتم تشغيل الفيديو`)
    
    // في حالة وجود رابط فيديو
    if (item.video_url) {
        window.open(item.video_url, '_blank')
    }
}

// ============================================================
// دوال الإشعارات
// ============================================================
function toggleNotifications() {
    const modal = document.getElementById('notifModal')
    if (!modal) return
    modal.classList.toggle('show')
    
    if (modal.classList.contains('show')) {
        renderNotifications()
    }
}

function renderNotifications() {
    const container = document.getElementById('notifList')
    if (!container) return
    
    if (notifications.length === 0) {
        container.innerHTML = `
            <div class="notif-empty">
                <i class="fas fa-bell-slash"></i>
                <p>لا توجد إشعارات</p>
            </div>
        `
        return
    }

    let html = notifications.map(n => `
        <div class="notif-item ${n.is_read ? 'read' : ''}" onclick="markNotificationRead('${n.id}')">
            <div class="notif-icon">${n.type === 'new_content' ? '📢' : n.type === 'update' ? '✏️' : '🔔'}</div>
            <div class="notif-text">
                <p>${n.message}</p>
                <span>${new Date(n.created_at).toLocaleString('ar-EG')}</span>
            </div>
        </div>
    `).join('')

    container.innerHTML = html
}

async function markNotificationRead(id) {
    try {
        await supabaseClient
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)
        
        notifications = notifications.map(n => 
            n.id === id ? { ...n, is_read: true } : n
        )
        
        updateNotificationBadge()
        renderNotifications()
    } catch (e) {
        console.error('خطأ:', e)
    }
}

// ============================================================
// دوال الملف الشخصي
// ============================================================
function toggleProfile() {
    const modal = document.getElementById('profileModal')
    if (modal) modal.classList.toggle('show')
}

// ============================================================
// دوال المودال
// ============================================================
function closeModal(id) {
    const modal = document.getElementById(id)
    if (modal) modal.classList.remove('show')
}

// إغلاق المودال عند النقر خارجه
document.addEventListener('click', (e) => {
    if (e.target.classList && e.target.classList.contains('modal')) {
        e.target.classList.remove('show')
    }
})

// ============================================================
// دوال القائمة الجانبية
// ============================================================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar')
    if (sidebar) sidebar.classList.toggle('open')
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar')
    if (sidebar) sidebar.classList.remove('open')
}

// ============================================================
// دوال الوضع الليلي
// ============================================================
function toggleTheme() {
    document.body.classList.toggle('light-mode')
    const icon = document.getElementById('themeIcon')
    if (icon) {
        icon.classList.toggle('fa-moon')
        icon.classList.toggle('fa-sun')
    }
    
    localStorage.setItem('devflix_theme', document.body.classList.contains('light-mode') ? 'light' : 'dark')
}

// ============================================================
// دوال تسجيل الخروج
// ============================================================
async function handleLogout() {
    if (!confirm('هل أنت متأكد من رغبتك في تسجيل الخروج؟')) return

    try {
        await supabaseClient.auth.signOut()
        localStorage.removeItem('devflix_session')
        localStorage.removeItem('devflix_user')
        window.location.href = 'index.html'
    } catch (e) {
        console.error('خطأ:', e)
        alert('حدث خطأ أثناء تسجيل الخروج')
    }
}

// ============================================================
// التهيئة
// ============================================================
async function init() {
    // التحقق من الجلسة
    const hasSession = await checkSession()
    if (!hasSession) {
        window.location.href = 'index.html'
        return
    }

    // تحميل بيانات المستخدم
    await loadUserData()
    
    // تحميل المحتوى
    await loadContent()
    
    // تحميل الإشعارات
    await loadNotifications()

    // استعادة الوضع
    const theme = localStorage.getItem('devflix_theme')
    if (theme === 'light') {
        document.body.classList.add('light-mode')
        const icon = document.getElementById('themeIcon')
        if (icon) {
            icon.classList.remove('fa-moon')
            icon.classList.add('fa-sun')
        }
    }

    // الاستماع للبحث عند الضغط على Enter
    const searchInput = document.getElementById('searchInput')
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch()
            }
        })
    }
}

// بدء التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', init)