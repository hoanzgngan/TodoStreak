// Streak Tracker System
class StreakTracker {
    constructor() {
        this.topics = [];
        this.storageKey = 'streakData';
        this.currentDetailTopicId = null;
        this.currentCalendarDate = new Date(); // Track calendar month
        this.init();
    }

    // Khởi tạo
    init() {
        this.loadFromStorage();
        this.renderTopics();
        this.setupEventListeners();
    }

    // Setup event listeners
    setupEventListeners() {
        const addTopicBtn = document.getElementById('addTopicBtn');
        const modal = document.getElementById('topicModal');
        const closeBtn = document.querySelector('.close');
        const saveTopicBtn = document.getElementById('saveTopicBtn');
        const topicNameInput = document.getElementById('topicNameInput');
        
        // Modal chi tiết
        const detailModal = document.getElementById('detailModal');
        const closeDetailBtn = document.querySelector('.close-detail');

        // Mở modal thêm chủ đề
        addTopicBtn.addEventListener('click', () => {
            modal.style.display = 'block';
            topicNameInput.value = '';
            topicNameInput.focus();
        });

        // Đóng modal thêm
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        // Đóng modal chi tiết
        closeDetailBtn.addEventListener('click', () => {
            detailModal.style.display = 'none';
        });

        // Đóng modal khi click ngoài
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
            if (e.target === detailModal) {
                detailModal.style.display = 'none';
            }
        });

        // Lưu chủ đề mới
        saveTopicBtn.addEventListener('click', () => {
            const topicName = topicNameInput.value.trim();
            if (topicName) {
                this.addTopic(topicName);
                modal.style.display = 'none';
            } else {
                this.showNotification('Vui lòng nhập tên chủ đề', 'error');
            }
        });

        // Enter để lưu
        topicNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveTopicBtn.click();
            }
        });
    }

    // Thêm chủ đề
    addTopic(topicName) {
        const topic = {
            id: Date.now(),
            name: topicName,
            streaks: {},
            createdDate: new Date().toISOString()
        };
        this.topics.push(topic);
        this.saveToStorage();
        this.renderTopics();
        this.showNotification(`✨ Chủ đề "${topicName}" đã được tạo`, 'success');
    }

    // Xóa chủ đề
    deleteTopic(topicId) {
        if (confirm('Bạn có chắc muốn xóa chủ đề này?')) {
            this.topics = this.topics.filter(t => t.id !== topicId);
            this.saveToStorage();
            this.renderTopics();
            this.showNotification('Chủ đề đã được xóa', 'success');
        }
    }

    // Lấy ngày hôm nay ở dạng string (YYYY-MM-DD)
    getTodayDateString() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Toggle streak cho một ngày
    toggleStreak(topicId, dateString) {
        const topic = this.topics.find(t => t.id === topicId);
        if (!topic) return;

        // Không cho phép toggle ngày trong tương lại
        const today = this.getTodayDateString();
        if (dateString > today) {
            this.showNotification(`Không thể tick ngày trong tương lại`, 'error');
            return;
        }

        // Toggle: nếu có thì xóa, nếu không có thì thêm
        if (topic.streaks[dateString]) {
            delete topic.streaks[dateString];
            this.showNotification(`Đã bỏ streak vào ${this.formatDateVN(dateString)}`, 'success');
        } else {
            topic.streaks[dateString] = 1;
            this.showNotification(`Thêm streak vào ${this.formatDateVN(dateString)}`, 'success');
        }
        
        this.saveToStorage();
        this.renderTopics();
    }

    // Format ngày tiếng Việt
    formatDateVN(dateString) {
        const date = new Date(dateString + 'T00:00:00');
        const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('vi-VN', options);
    }

    // Render todos
    renderTopics() {
        const container = document.getElementById('topicsContainer');
        container.innerHTML = '';

        this.topics.forEach(topic => {
            const topicElement = this.createTopicElement(topic);
            container.appendChild(topicElement);
        });
    }

    // Tạo phần tử chủ đề
    createTopicElement(topic) {
        const div = document.createElement('div');
        div.className = 'topic-card topic-card-clickable';
        div.innerHTML = `
            <div class="topic-header">
                <div class="topic-title">
                    <span>${topic.name}</span>
                    <span class="topic-streak-count">${this.getTotalStreakCount(topic)}</span>
                </div>
                <button class="delete-topic-btn" onclick="event.stopPropagation(); streakTracker.deleteTopic(${topic.id})">
                    <i class="fas fa-trash"></i> Xóa
                </button>
            </div>
            <div class="days-grid" id="grid-${topic.id}"></div>
        `;

        // Click vào topic card để xem chi tiết
        div.addEventListener('click', () => {
            this.showTopicDetail(topic);
        });

        // Render days grid
        const daysGridContainer = div.querySelector(`#grid-${topic.id}`);
        this.renderDaysGrid(topic, daysGridContainer);

        return div;
    }

    // Lấy tổng số streak (số ngày được tick)
    getTotalStreakCount(topic) {
        return Object.keys(topic.streaks).length;
    }

    // Lấy month-year từ date string (YYYY-MM-DD)
    getMonthYear(dateString) {
        return dateString.substring(0, 7); // YYYY-MM
    }

    // Tính streaks theo tháng (đếm số ngày được tick)
    getStreaksByMonth(topic) {
        const monthMap = {};
        
        for (const dateString of Object.keys(topic.streaks)) {
            const monthYear = this.getMonthYear(dateString);
            if (!monthMap[monthYear]) {
                monthMap[monthYear] = 0;
            }
            monthMap[monthYear]++;
        }
        
        return monthMap;
    }

    // Lấy tháng hiện tại (YYYY-MM)
    getCurrentMonth() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    }

    // Lấy tháng trước (YYYY-MM)
    getPreviousMonth() {
        const today = new Date();
        const prevDate = new Date(today.getFullYear(), today.getMonth() - 1);
        const year = prevDate.getFullYear();
        const month = String(prevDate.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    }

    // Format tháng để hiển thị
    formatMonthDisplay(monthYear) {
        const [year, month] = monthYear.split('-');
        const monthNames = ['', 'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
                           'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
        return `${monthNames[parseInt(month)]} ${year}`;
    }

    // Hiển thị chi tiết topic
    showTopicDetail(topic) {
        const detailModal = document.getElementById('detailModal');

        // Set title
        document.getElementById('detailTopicTitle').textContent = ` ${topic.name}`;

        // Initialize calendar with current month (ONLY on first open)
        this.currentCalendarDate = new Date();
        this.currentDetailTopicId = topic.id;
        
        // Update stats and calendar
        this.updateTopicDetailStats(topic);
        this.renderCalendar(topic);
        this.setupCalendarEventListeners(topic);

        // Show modal
        detailModal.style.display = 'block';
    }

    // Update topic stats (called when updating streak)
    updateTopicDetailStats(topic) {
        const currentMonthElem = document.getElementById('currentMonthStreak');
        const previousMonthElem = document.getElementById('previousMonthStreak');
        const totalElem = document.getElementById('totalStreakValue');
        const streaksListElem = document.getElementById('streaksList');

        // Tính streaks theo tháng
        const monthlyStreaks = this.getStreaksByMonth(topic);
        const currentMonth = this.getCurrentMonth();
        const previousMonth = this.getPreviousMonth();

        const currentMonthCount = monthlyStreaks[currentMonth] || 0;
        const previousMonthCount = monthlyStreaks[previousMonth] || 0;
        const totalCount = this.getTotalStreakCount(topic);

        currentMonthElem.textContent = currentMonthCount;
        previousMonthElem.textContent = previousMonthCount;
        totalElem.textContent = totalCount;

        // Render streaks list
        streaksListElem.innerHTML = '';

        // Sort dates in descending order (newest first)
        const sortedDates = Object.keys(topic.streaks).sort().reverse();

        if (sortedDates.length === 0) {
            streaksListElem.innerHTML = '<div class="empty-message">Chưa có streak nào. Hãy bắt đầu bằng cách nhấp vào các ngày!</div>';
        } else {
            sortedDates.forEach(dateString => {
                const date = new Date(dateString + 'T00:00:00');
                const monthYear = this.getMonthYear(dateString);
                
                const streakItem = document.createElement('div');
                streakItem.className = 'streak-item';
                streakItem.innerHTML = `
                    <div class="streak-date">
                        <span class="streak-date-main">${this.formatDateVN(dateString)}</span>
                        <span class="streak-date-secondary">${this.formatMonthDisplay(monthYear)}</span>
                    </div>
                    <span class="streak-count">🔥 Đã tick</span>
                `;
                streaksListElem.appendChild(streakItem);
            });
        }
    }

    // Render calendar
    renderCalendar(topic) {
        const grid = document.getElementById('calendarGrid');
        const title = document.getElementById('calendarTitle');
        
        const year = this.currentCalendarDate.getFullYear();
        const month = this.currentCalendarDate.getMonth();
        
        // Set title
        const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
                           'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
        title.textContent = `${monthNames[month]} ${year}`;
        
        grid.innerHTML = '';
        
        // Add day headers (Thứ 2 - Chủ nhật)
        const dayHeaders = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
        dayHeaders.forEach(header => {
            const headerDiv = document.createElement('div');
            headerDiv.className = 'calendar-day-header';
            headerDiv.textContent = header;
            grid.appendChild(headerDiv);
        });
        
        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        // Adjust first day to Monday (1 = Monday, 0 = Sunday, convert)
        let startDay = firstDay.getDay();
        startDay = startDay === 0 ? 6 : startDay - 1;
        
        // Get previous month's days for empty cells
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        
        // Helper function to format date consistently
        const formatDateString = (date) => {
            const yr = date.getFullYear();
            const mth = String(date.getMonth() + 1).padStart(2, '0');
            const dy = String(date.getDate()).padStart(2, '0');
            return `${yr}-${mth}-${dy}`;
        };
        
        // Add days from previous month
        for (let i = startDay - 1; i >= 0; i--) {
            const day = prevMonthLastDay - i;
            const prevDate = new Date(year, month - 1, day);
            const dateString = formatDateString(prevDate);
            this.createCalendarDayElement(grid, day, dateString, topic, true);
        }
        
        // Add days of current month
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(year, month, day);
            const dateString = formatDateString(currentDate);
            this.createCalendarDayElement(grid, day, dateString, topic, false);
        }
        
        // Add days from next month
        const totalCells = grid.children.length - 7; // Subtract day headers
        const remainingCells = 42 - totalCells; // 6 rows x 7 days
        for (let day = 1; day <= remainingCells; day++) {
            const nextDate = new Date(year, month + 1, day);
            const dateString = formatDateString(nextDate);
            this.createCalendarDayElement(grid, day, dateString, topic, true);
        }
    }

    // Create a calendar day element
    createCalendarDayElement(grid, day, dateString, topic, isOtherMonth) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        dayDiv.style.textDecoration = 'none';
        
        const today = this.getTodayDateString();
        const isFuture = dateString > today;
        
        if (topic.streaks[dateString]) {
            dayDiv.classList.add('completed');
        }
        
        // Chỉ disable các ngày tương lai
        if (isFuture) {
            dayDiv.classList.add('disabled');
        }
        
        // Thêm other-month class để styling khác (nhưng vẫn cho phép click)
        if (isOtherMonth) {
            dayDiv.classList.add('other-month');
        }
        
        const dayNumber = document.createElement('div');
        dayNumber.className = 'calendar-day-number';
        dayNumber.textContent = day;
        dayNumber.style.textDecoration = 'none';
        dayDiv.appendChild(dayNumber);
        
        if (topic.streaks[dateString]) {
            const streakSpan = document.createElement('div');
            streakSpan.className = 'calendar-day-streak';
            streakSpan.textContent = '🔥';
            streakSpan.style.textDecoration = 'none';
            dayDiv.appendChild(streakSpan);
        }
        
        // Cho phép click nếu không phải ngày tương lai
        if (!isFuture) {
            dayDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleStreak(topic.id, dateString);
                // Update stats and refresh calendar WITHOUT changing month
                this.updateTopicDetailStats(topic);
                this.renderCalendar(topic);
            });
            dayDiv.style.cursor = 'pointer';
        } else {
            dayDiv.style.cursor = 'not-allowed';
        }
        
        grid.appendChild(dayDiv);
    }

    // Setup calendar event listeners
    setupCalendarEventListeners(topic) {
        const prevBtn = document.getElementById('prevMonthBtn');
        const nextBtn = document.getElementById('nextMonthBtn');
        
        prevBtn.onclick = () => {
            this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() - 1);
            this.renderCalendar(topic);
        };
        
        nextBtn.onclick = () => {
            this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + 1);
            this.renderCalendar(topic);
        };
    }

    // Render calendar days
    renderDaysGrid(topic, container) {
        const today = new Date();
        const todayString = this.getTodayDateString();
        const daysToShow = 14; // Hiển thị 14 ngày gần nhất

        for (let i = daysToShow - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            // Format date string using local timezone
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;
            
            const isFuture = dateString > todayString;

            const dayBox = document.createElement('div');
            dayBox.className = 'day-box';
            dayBox.innerHTML = `
                <div class="day-circle ${topic.streaks[dateString] ? 'completed' : ''} ${isFuture ? 'disabled' : ''}" 
                     ${!isFuture ? `onclick="event.stopPropagation(); streakTracker.toggleStreak(${topic.id}, '${dateString}')"` : ''} 
                     data-streak-count="${topic.streaks[dateString] ? 1 : 0}">
                    ${topic.streaks[dateString] ? '🔥' : ''}
                </div>
                <div class="day-label">${date.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric' })}</div>
            `;

            container.appendChild(dayBox);
        }
    }

    // Hiển thị thông báo
    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification show ${type}`;

        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Lưu vào localStorage
    saveToStorage() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.topics));
    }

    // Tải từ localStorage
    loadFromStorage() {
        const data = localStorage.getItem(this.storageKey);
        if (data) {
            try {
                this.topics = JSON.parse(data);
            } catch (e) {
                console.error('Error loading streak data:', e);
                this.topics = [];
            }
        } else {
            this.topics = [];
        }
    }

    // Xuất dữ liệu (cho backup)
    exportData() {
        const dataStr = JSON.stringify(this.topics, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `streak-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    // Nhập dữ liệu (từ backup)
    importData(jsonData) {
        try {
            this.topics = JSON.parse(jsonData);
            this.saveToStorage();
            this.renderTopics();
            this.showNotification('Dữ liệu đã được nhập thành công', 'success');
        } catch (e) {
            this.showNotification('Lỗi nhập dữ liệu', 'error');
        }
    }
}

// Khởi tạo Streak Tracker
let streakTracker;

document.addEventListener('DOMContentLoaded', () => {
    streakTracker = new StreakTracker();
});
