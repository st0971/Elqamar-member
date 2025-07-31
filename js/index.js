// 登入邏輯
const USERNAME = "Elqamar@";
const PASSWORD = "Memberpage";

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
let editingMemberId = null;

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
        <td>${index + 1}</td>
        <td><a href="#" onclick="openOrderModal(${index})" class="member-link">${m.name}</a></td>
        <td>${orderCount}</td>
        <td>
          <button onclick="editMember(${index})">修改</button>
          <button onclick="deleteMember(${index})">刪除</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

  // 修正編輯中會員 index
  if (editingMemberId !== null) {
    const newIndex = members.findIndex(m => m.id === editingMemberId);
    if (newIndex !== -1) {
      editingMemberIndex = newIndex;
    }
  }
}

// 搜尋框即時更新
document.getElementById("search").addEventListener("input", renderTable);

// 點擊外面清空搜尋框
document.addEventListener("click", function (event) {
  const searchInput = document.getElementById("search");
  if (event.target !== searchInput && searchInput.value !== "") {
    searchInput.value = "";
    renderTable();
  }
});

// 新增會員
document.getElementById("add-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const url = document.getElementById("url").value.trim();

  if (!name) {
    alert("請輸入名稱");
    return;
  }
  if (members.some(m => m.name === name)) {
    alert("已有相同名稱的會員名稱");
    return;
  }
  if (url && members.some(m => m.url === url)) {
    alert("已有相同連結的會員");
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

function editMember(index) {
  const member = members[index];
  const newName = prompt("請輸入新的名稱：", member.name);
  if (newName === null) return;
  const trimmedName = newName.trim();
  if (!trimmedName) return;

  // 檢查重複名稱
  if (members.some((m, i) => i !== index && m.name === trimmedName)) {
    alert("已有相同名稱的會員");
    return;
  }

  const newUrl = prompt("請輸入新的連結：", member.url || "");
  const trimmedUrl = newUrl?.trim();

  if (trimmedUrl && members.some((m, i) => i !== index && m.url === trimmedUrl)) {
    alert("已有相同連結的會員");
    return;
  }

  member.name = trimmedName;
  member.url = trimmedUrl || "";
  saveToStorage();
  renderTable();
}

function deleteMember(index) {
  if (confirm("確定要刪除？")) {
    members.splice(index, 1);
    saveToStorage();
    renderTable();
  }
}

// 訂單 Modal
function openOrderModal(index) {
  editingMemberIndex = index;
  editingMemberId = members[index].id;
  const member = members[index];
  document.getElementById("modal-title").innerHTML =
    `會員名稱：<a href="${member.url || '#'}" target="_blank" class="member-link">${member.name}</a>`;
  document.getElementById("order-modal").style.display = "block";
  renderOrderRows();
}

function closeModal() {
  document.getElementById("order-modal").style.display = "none";
  editingMemberIndex = -1;
  editingMemberId = null;
}

// 點擊背景關閉 Modal
document.getElementById("order-modal").addEventListener("click", function (e) {
  if (e.target === this) closeModal();
});

function renderOrderRows() {
  const tbody = document.querySelector("#order-table tbody");
  tbody.innerHTML = "";
  const member = members[editingMemberIndex];
  member.orders = member.orders || [];

  member.orders.forEach((order, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <input type="text" value="${order.product}" data-index="${i}" data-field="product" title="${order.product}" />
      </td>
      <td><input type="number" min="0" value="${order.price}" data-index="${i}" data-field="price" /></td>
      <td><input type="checkbox" ${order.done ? "checked" : ""} data-index="${i}" data-field="done" /></td>
      <td><input type="text" value="${order.note}" data-index="${i}" data-field="note" /></td>
      <td><button onclick="deleteOrder(${i})">刪除</button></td>
    `;
    tbody.appendChild(tr);
  });

  // 綁定欄位變化事件
  tbody.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", (e) => {
      const idx = parseInt(e.target.dataset.index);
      const field = e.target.dataset.field;

      if (field === "done") {
        members[editingMemberIndex].orders[idx][field] = e.target.checked;
      } else if (field === "price") {
        let val = parseInt(e.target.value);
        val = isNaN(val) ? 0 : Math.max(0, val); // 防止 NaN 和負數
        members[editingMemberIndex].orders[idx][field] = val;
        e.target.value = val; // 同步修正輸入值
      } else {
        members[editingMemberIndex].orders[idx][field] = e.target.value;
      }

      saveToStorage();
      renderTable();
    });
  });
}

function addOrderRow() {
  const member = members[editingMemberIndex];
  member.orders.push({ product: "", price: 0, done: false, note: "" });
  saveToStorage();     // ✅ 新增後儲存
  renderOrderRows();   // ✅ 重新顯示訂單欄位
  renderTable();       // ✅ 更新主畫面商品數量
}


function deleteOrder(i) {
  if (confirm("確定刪除此筆訂單？")) {
    members[editingMemberIndex].orders.splice(i, 1);
    saveToStorage();
    renderOrderRows();
    renderTable();
  }
}

function saveOrders() {
  saveToStorage();
  renderTable();
  closeModal();
}
