// 登入邏輯
const USERNAME = "Elqmar@";
const PASSWORD = "Member@recorderpage";

document.getElementById("login-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const u = document.getElementById("username").value;
  const p = document.getElementById("password").value;
  if (u === USERNAME && p === PASSWORD) {
    document.getElementById("login-page").style.display = "none";
    document.getElementById("main-page").style.display = "block";
    loadMembers();
  } else {
    document.getElementById("login-error").innerText = "帳號或密碼錯誤";
  }
});

function logout() {
  document.getElementById("main-page").style.display = "none";
  document.getElementById("login-page").style.display = "block";
}

// 資料儲存
let members = [];
let currentId = 0;
let editingMemberIndex = -1;

// 載入資料
function loadMembers() {
  const data = localStorage.getItem("members");
  if (data) {
    members = JSON.parse(data);
    currentId = members.reduce((max, m) => Math.max(max, m.id), 0);
  }
  renderTable();
}

function saveToStorage() {
  localStorage.setItem("members", JSON.stringify(members));
}

// 渲染主表格
function renderTable() {
  const keyword = document.getElementById("search").value.toLowerCase();
  const tbody = document.querySelector("#member-table tbody");
  tbody.innerHTML = "";

  members
    .filter((m) => m.name.toLowerCase().includes(keyword))
    .forEach((m, index) => {
      const tr = document.createElement("tr");
      const orderCount = m.orders?.length || 0;
      tr.innerHTML = `
        <td>${index + 1}</td> <!-- 用表格順序編號 -->
        <td><a href="#" onclick="openOrderModal(${index})" class="member-link">${m.name}</a></td>
        <td>${orderCount}</td>
        <td>
          <button onclick="editMember(${index})">修改</button>
          <button onclick="deleteMember(${index})">刪除</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
}

// 搜尋框即時更新
document.getElementById("search").addEventListener("input", function() {
  renderTable();
});

// 點擊外面清空搜尋框
document.addEventListener("click", function(event) {
  const searchInput = document.getElementById("search");
  if (event.target !== searchInput) {
    if (searchInput.value !== "") {
      searchInput.value = "";
      renderTable();
    }
  }
});

// 新增會員表單
document.getElementById("add-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const url = document.getElementById("url").value.trim();
  if (!name) {
    alert("請輸入名稱");
    return;
  }
  currentId++;
  members.push({
    id: currentId,
    name,
    url,
    orders: [],
  });
  saveToStorage();
  closeAddForm();
  renderTable();
});

function openAddForm() {
  document.getElementById("add-form").style.display = "block";
  document.getElementById("name").value = "";
  document.getElementById("url").value = "";
}

function closeAddForm() {
  document.getElementById("add-form").style.display = "none";
}

// 修改會員（名稱與連結）
function editMember(index) {
  const member = members[index];
  const newName = prompt("請輸入新的名稱：", member.name);
  if (newName === null) return;
  member.name = newName.trim() || member.name;

  const newUrl = prompt("請輸入新的連結：", member.url || "");
  if (newUrl !== null) member.url = newUrl.trim();

  saveToStorage();
  renderTable();
}

// 刪除會員
function deleteMember(index) {
  if (confirm("確定要刪除？")) {
    members.splice(index, 1);
    saveToStorage();
    renderTable();
  }
}

//////////////////////////
// 訂單 Modal 操作區域 //
//////////////////////////

function openOrderModal(index) {
  editingMemberIndex = index;
  const member = members[index];
  document.getElementById("modal-title").innerHTML = `會員名稱：<a href="${member.url || '#'}" target="_blank" class="member-link">${member.name}</a>`;
  document.getElementById("order-modal").style.display = "block";
  renderOrderRows();
}

function closeModal() {
  document.getElementById("order-modal").style.display = "none";
  editingMemberIndex = -1;
}

// 渲染訂單列
function renderOrderRows() {
  const tbody = document.querySelector("#order-table tbody");
  tbody.innerHTML = "";
  const member = members[editingMemberIndex];
  member.orders = member.orders || [];

  member.orders.forEach((order, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="text" value="${order.product}" data-index="${i}" data-field="product" /></td>
      <td><input type="number" value="${order.price}" data-index="${i}" data-field="price" /></td>
      <td><input type="checkbox" ${order.done ? "checked" : ""} data-index="${i}" data-field="done" /></td>
      <td><input type="text" value="${order.note}" data-index="${i}" data-field="note" /></td>
      <td><button onclick="deleteOrder(${i})">刪除</button></td>
    `;
    tbody.appendChild(tr);
  });

  // 綁定即時更新欄位變化
  tbody.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", (e) => {
      const idx = parseInt(e.target.dataset.index);
      const field = e.target.dataset.field;
      if (field === "done") {
        members[editingMemberIndex].orders[idx][field] = e.target.checked;
      } else if (field === "price") {
        members[editingMemberIndex].orders[idx][field] = parseInt(e.target.value) || 0;
      } else {
        members[editingMemberIndex].orders[idx][field] = e.target.value;
      }
    });
  });
}

function addOrderRow() {
  const member = members[editingMemberIndex];
  member.orders.push({ product: "", price: 0, done: false, note: "" });
  renderOrderRows();
}

function deleteOrder(i) {
  if (confirm("確定刪除此筆訂單？")) {
    members[editingMemberIndex].orders.splice(i, 1);
    renderOrderRows();
  }
}

function saveOrders() {
  saveToStorage();
  renderTable();
  closeModal();
}
