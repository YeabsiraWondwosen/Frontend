class TaskManager {
  constructor() {
    this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    this.history = JSON.parse(localStorage.getItem('history')) || [];
    this.currentTaskId = null;
  }

  addTask(title, deadline) {
    if (!title) return false;

    const newTask = {
      id: Date.now(),
      title,
      deadline,
      completed: false,
      createdAt: new Date().toISOString(),
      status: 'pending',
      history: []
    };

    this.tasks.push(newTask);
    this.saveTasks();
    return true;
  }

  completeTask(id) {
    const task = this.tasks.find(task => task.id === id);
    if (task) {
      task.completed = true;
      task.completedAt = new Date().toISOString();
      task.status = 'completed';
      
      task.history.push({
        action: 'completed',
        date: new Date().toISOString()
      });
      
      this.saveTasks();
      return true;
    }
    return false;
  }

  deleteTask(id) {
    const taskIndex = this.tasks.findIndex(task => task.id === id);
    if (taskIndex !== -1) {
      const deletedTask = this.tasks[taskIndex];
      this.history.push({
        ...deletedTask,
        deletedAt: new Date().toISOString()
      });
      
      this.tasks.splice(taskIndex, 1);
      this.saveTasks();
      this.saveHistory();
      return true;
    }
    return false;
  }

  deleteHistoryItem(id) {
    const historyIndex = this.history.findIndex(item => item.id === id);
    if (historyIndex !== -1) {
      this.history.splice(historyIndex, 1);
      this.saveHistory();
      return true;
    }
    return false;
  }

  rescheduleTask(newDeadline) {
    const task = this.tasks.find(task => task.id === this.currentTaskId);
    if (task) {
      const oldDeadline = task.deadline;
      task.deadline = newDeadline;
      
      task.history.push({
        action: 'rescheduled',
        date: new Date().toISOString(),
        from: oldDeadline,
        to: task.deadline
      });
      
      this.saveTasks();
      return true;
    }
    return false;
  }

  isOverdue(task) {
    if (task.completed) return false;
    const now = new Date();
    const deadline = new Date(task.deadline);
    return deadline < now;
  }

  getPendingTasks(filter = 'all') {
    let filteredTasks = this.tasks.filter(task => !task.completed);
    
    if (filter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filteredTasks = filteredTasks.filter(task => {
        const taskDate = new Date(task.deadline);
        return taskDate.toDateString() === today.toDateString();
      });
    } else if (filter === 'upcoming') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filteredTasks = filteredTasks.filter(task => {
        const taskDate = new Date(task.deadline);
        return taskDate > today;
      });
    } else if (filter === 'overdue') {
      const now = new Date();
      filteredTasks = filteredTasks.filter(task => {
        const taskDate = new Date(task.deadline);
        return taskDate < now;
      });
    }
    
    return filteredTasks;
  }

  getCompletedTasks(filter = 'all') {
    let filteredTasks = this.tasks.filter(task => task.completed);
    
    if (filter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filteredTasks = filteredTasks.filter(task => {
        const taskDate = new Date(task.completedAt);
        return taskDate.toDateString() === today.toDateString();
      });
    } else if (filter === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      filteredTasks = filteredTasks.filter(task => {
        const taskDate = new Date(task.completedAt);
        return taskDate > oneWeekAgo;
      });
    } else if (filter === 'month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      filteredTasks = filteredTasks.filter(task => {
        const taskDate = new Date(task.completedAt);
        return taskDate > oneMonthAgo;
      });
    }
    
    return filteredTasks;
  }

  getHistory(filter = 'all') {
    let filteredHistory = [...this.history];
    
    if (filter === 'overdue') {
      filteredHistory = filteredHistory.filter(item => this.isOverdue(item));
    } else if (filter === 'rescheduled') {
      filteredHistory = filteredHistory.filter(item => item.history?.some(h => h.action === 'rescheduled'));
    }
    
    return filteredHistory;
  }

  getStatistics() {
    const totalTasks = this.tasks.length;
    const completedCount = this.tasks.filter(task => task.completed).length;
    const overdueCount = this.tasks.filter(task => this.isOverdue(task)).length;
    
    const completedPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
    const overduePercent = totalTasks > 0 ? Math.round((overdueCount / totalTasks) * 100) : 0;
    
    return {
      totalTasks,
      completedCount,
      overdueCount,
      completedPercent,
      overduePercent
    };
  }

  saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(this.tasks));
  }

  saveHistory() {
    localStorage.setItem('history', JSON.stringify(this.history));
  }

  clearData() {
    localStorage.removeItem('tasks');
    localStorage.removeItem('history');
    this.tasks = [];
    this.history = [];
  }
}

class TaskChart {
  constructor(ctx) {
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Total', 'Completed', 'Pending', 'Overdue'],
        datasets: [{
          label: 'Task Statistics',
          data: [0, 0, 0, 0],
          backgroundColor: [
            'rgba(0, 180, 219, 0.7)',
            'rgba(76, 175, 80, 0.7)',
            'rgba(255, 152, 0, 0.7)',
            'rgba(244, 67, 54, 0.7)'
          ],
          borderColor: [
            'rgb(0, 180, 219)',
            'rgb(76, 175, 80)',
            'rgb(255, 152, 0)',
            'rgb(244, 67, 54)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  update(data) {
    this.chart.data.datasets[0].data = [
      data.totalTasks, 
      data.completedCount, 
      data.totalTasks - data.completedCount, 
      data.overdueCount
    ];
    this.chart.update();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const taskManager = new TaskManager();
  const ctx = document.getElementById('statsChart').getContext('2d');
  const taskChart = new TaskChart(ctx);
  
  // DOM Elements
  const taskInput = document.getElementById('taskInput');
  const taskDeadline = document.getElementById('taskDeadline');
  const addTaskBtn = document.getElementById('addTaskBtn');
  const pendingTasksList = document.getElementById('pendingTasks');
  const completedTasksList = document.getElementById('completedTasks');
  const historyList = document.getElementById('historyList');
  const navButtons = document.querySelectorAll('.nav-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const totalTasksElem = document.getElementById('totalTasks');
  const completedPercentElem = document.getElementById('completedPercent');
  const overduePercentElem = document.getElementById('overduePercent');
  const rescheduleModal = document.getElementById('rescheduleModal');
  const closeModal = document.querySelector('.close');
  const confirmRescheduleBtn = document.getElementById('confirmReschedule');
  const rescheduleTaskTitle = document.getElementById('rescheduleTaskTitle');
  const originalDeadlineElem = document.getElementById('originalDeadline');
  const newDeadlineInput = document.getElementById('newDeadline');
  const pendingFilter = document.getElementById('pendingFilter');
  const completedFilter = document.getElementById('completedFilter');
  const historyFilter = document.getElementById('historyFilter');
  const clearAllBtn = document.getElementById('clearAllBtn');

  // Initialize the app
  initApp();
  
  function initApp() {
    renderTasks();
    renderHistory();
    updateStatistics();
    
    // Set default deadline to today at 17:00
    const now = new Date();
    now.setHours(17, 0, 0, 0);
    taskDeadline.valueAsNumber = now.getTime() - now.getTimezoneOffset() * 60000;
  }

  function addTask() {
    const title = taskInput.value.trim();
    const deadline = taskDeadline.value;
    
    if (!title) {
      alert('Please enter a task title');
      return;
    }
    
    if (taskManager.addTask(title, deadline)) {
      renderTasks();
      updateStatistics();
      taskInput.value = '';
      taskInput.focus();
      switchTab('pending');
    }
  }

  function renderTasks() {
    renderPendingTasks();
    renderCompletedTasks();
  }

  function renderPendingTasks() {
    pendingTasksList.innerHTML = '';
    const filterValue = pendingFilter.value;
    const filteredTasks = taskManager.getPendingTasks(filterValue);
    
    if (filteredTasks.length === 0) {
      pendingTasksList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-clipboard-list"></i>
          <h3>No Pending Tasks</h3>
          <p>Add a new task using the form below</p>
        </div>
      `;
      return;
    }
    
    filteredTasks.forEach(task => {
      const taskElement = createTaskElement(task);
      pendingTasksList.appendChild(taskElement);
    });
  }

  function renderCompletedTasks() {
    completedTasksList.innerHTML = '';
    const filterValue = completedFilter.value;
    const filteredTasks = taskManager.getCompletedTasks(filterValue);
    
    if (filteredTasks.length === 0) {
      completedTasksList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-check-circle"></i>
          <h3>No Completed Tasks</h3>
          <p>Complete some tasks to see them here</p>
        </div>
      `;
      return;
    }
    
    filteredTasks.forEach(task => {
      const taskElement = createTaskElement(task);
      completedTasksList.appendChild(taskElement);
    });
  }

  function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''} ${taskManager.isOverdue(task) ? 'overdue' : ''}`;
    li.dataset.id = task.id;
    
    const deadlineDate = new Date(task.deadline);
    const deadlineText = deadlineDate.toLocaleString([], { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    });
    
    const completedDate = task.completedAt ? new Date(task.completedAt) : null;
    const completedText = completedDate ? completedDate.toLocaleString([], { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    }) : '';
    
    let statusText = 'Pending';
    let statusClass = 'status-pending';
    
    if (task.completed) {
      statusText = 'Completed';
      statusClass = 'status-completed';
    } else if (taskManager.isOverdue(task)) {
      statusText = 'Overdue';
      statusClass = 'status-overdue';
    }
    
    li.innerHTML = `
      <div class="task-info">
        <div class="task-title">${task.title}</div>
        <div class="task-deadline">
          <i class="far ${task.completed ? 'fa-check-circle' : 'fa-clock'}"></i> 
          ${task.completed ? `Completed: ${completedText}` : `Deadline: ${deadlineText}`}
        </div>
        <div class="task-actions">
          ${!task.completed ? `
            <button class="task-btn complete-btn">
              <i class="fas fa-check"></i> Complete
            </button>
          ` : ''}
          ${taskManager.isOverdue(task) && !task.completed ? `
            <button class="task-btn reschedule-btn">
              <i class="fas fa-calendar-alt"></i> Reschedule
            </button>
          ` : ''}
          <button class="task-btn delete-btn">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>
      <div class="task-status ${statusClass}">${statusText}</div>
    `;
    
    if (!task.completed) {
      li.querySelector('.complete-btn').addEventListener('click', () => {
        if (taskManager.completeTask(task.id)) {
          renderTasks();
          updateStatistics();
        }
      });
      
      if (taskManager.isOverdue(task)) {
        li.querySelector('.reschedule-btn').addEventListener('click', () => openRescheduleModal(task.id));
      }
    }
    
    li.querySelector('.delete-btn').addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this task?')) {
        if (taskManager.deleteTask(task.id)) {
          renderTasks();
          renderHistory();
          updateStatistics();
        }
      }
    });
    
    return li;
  }

  function renderHistory() {
    historyList.innerHTML = '';
    const filterValue = historyFilter.value;
    const filteredHistory = taskManager.getHistory(filterValue);
    
    if (filteredHistory.length === 0) {
      historyList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-history"></i>
          <h3>No History Found</h3>
          <p>Your task history will appear here</p>
        </div>
      `;
      return;
    }
    
    filteredHistory.forEach(item => {
      const historyItem = createHistoryItem(item);
      historyList.appendChild(historyItem);
    });
  }

  function createHistoryItem(item) {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.dataset.id = item.id;
    
    const deletedDate = new Date(item.deletedAt);
    const deletedText = deletedDate.toLocaleString([], { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    });
    
    let historyContent = `
      <div class="task-info">
        <div class="task-title">${item.title}</div>
        <div class="task-deadline">
          <i class="fas fa-trash"></i> Deleted on: ${deletedText}
        </div>
    `;
    
    const rescheduleHistory = item.history?.filter(h => h.action === 'rescheduled');
    if (rescheduleHistory && rescheduleHistory.length > 0) {
      historyContent += `<div class="task-deadline"><i class="fas fa-exchange-alt"></i> Rescheduled ${rescheduleHistory.length} times</div>`;
    }
    
    if (item.completed) {
      const completedDate = new Date(item.completedAt);
      const completedText = completedDate.toLocaleString([], { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit'
      });
      historyContent += `<div class="task-deadline"><i class="fas fa-check-circle"></i> Completed on: ${completedText}</div>`;
    }
    
    historyContent += `
      </div>
      <button class="task-btn delete-btn">
        <i class="fas fa-trash"></i> Delete
      </button>
    `;
    
    li.innerHTML = historyContent;
    
    li.querySelector('.delete-btn').addEventListener('click', () => {
      if (confirm('Are you sure you want to permanently delete this history item?')) {
        if (taskManager.deleteHistoryItem(item.id)) {
          renderHistory();
        }
      }
    });
    
    return li;
  }

  function updateStatistics() {
    const stats = taskManager.getStatistics();
    totalTasksElem.textContent = stats.totalTasks;
    completedPercentElem.textContent = `${stats.completedPercent}%`;
    overduePercentElem.textContent = `${stats.overduePercent}%`;
    taskChart.update(stats);
  }

  function switchTab(target) {
    navButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    document.querySelector(`[data-target="${target}"]`).classList.add('active');
    document.getElementById(target).classList.add('active');
  }

  function openRescheduleModal(taskId) {
    const task = taskManager.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    taskManager.currentTaskId = taskId;
    rescheduleTaskTitle.textContent = task.title;
    
    const deadlineDate = new Date(task.deadline);
    originalDeadlineElem.textContent = deadlineDate.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    newDeadlineInput.valueAsNumber = deadlineDate.getTime() - deadlineDate.getTimezoneOffset() * 60000;
    rescheduleModal.style.display = 'block';
  }

  function rescheduleTask() {
    const newDeadline = newDeadlineInput.value;
    if (!newDeadline) return;
    
    if (taskManager.rescheduleTask(newDeadline)) {
      renderTasks();
      updateStatistics();
      rescheduleModal.style.display = 'none';
    }
  }

  // Event Listeners
  addTaskBtn.addEventListener('click', addTask);
  taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
  });
  
  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      const target = button.getAttribute('data-target');
      switchTab(target);
    });
  });
  
  closeModal.addEventListener('click', () => {
    rescheduleModal.style.display = 'none';
  });
  
  confirmRescheduleBtn.addEventListener('click', rescheduleTask);
  
  pendingFilter.addEventListener('change', () => renderPendingTasks());
  completedFilter.addEventListener('change', () => renderCompletedTasks());
  historyFilter.addEventListener('change', () => renderHistory());
  
  clearAllBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all tasks and history? This cannot be undone.')) {
      taskManager.clearData();
      renderTasks();
      renderHistory();
      updateStatistics();
    }
  });
});