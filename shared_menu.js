(function () {
  const ADMIN_MENU_ITEMS = [
    { label: "Home", page: "index.html" },
    { label: "Dashboard", page: "dashboard.html" },
    { label: "Outstanding", page: "outstanding.html" },
    { label: "Accountant", page: "accountant.html" },
    { label: "Scholarship", page: "scholarship.html" },
    { label: "Exam Schedule", page: "exam_schedule.html" },
    { label: "Summary", page: "summary.html" },
    { label: "Fees Modify", page: "fees.html" },
    { label: "Receipt History", page: "receipt_history.html" },
    { label: "Export Data", page: "export.html" }
  ];
  const ACCOUNTANT_MENU_ITEMS = [
    { label: "Accountant Home", page: "accountant.html" }
  ];

  function isAccountantContext() {
    const path = (window.location.pathname || "").toLowerCase();
    const page = path.split("/").pop() || "";
    if (page.startsWith("accountant")) return true;
    const params = new URLSearchParams(window.location.search);
    return String(params.get("role") || "").toLowerCase() === "accountant";
  }

  function getMenuItems() {
    if (isAccountantContext()) return ACCOUNTANT_MENU_ITEMS;
    return ADMIN_MENU_ITEMS;
  }

  function resolveSession() {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("session");
    if (fromUrl) return fromUrl;

    const sessionSelect = document.getElementById("sessionSelect");
    if (sessionSelect && sessionSelect.value) return sessionSelect.value;

    return localStorage.getItem("session") || "2024_25";
  }

  function renderMenu(sideMenu) {
    if (!sideMenu) return;
    sideMenu.innerHTML = getMenuItems().map(
      (item) => `<div class="menu-item" onclick="goToPage('${item.page}')">${item.label}</div>`
    ).join("");
  }

  function toggleMenu() {
    const sideMenu = document.getElementById("sideMenu");
    const overlay = document.getElementById("overlay");
    if (!sideMenu || !overlay) return;
    sideMenu.classList.toggle("open");
    overlay.classList.toggle("show");
  }

  function closeMenu() {
    const sideMenu = document.getElementById("sideMenu");
    const overlay = document.getElementById("overlay");
    if (!sideMenu || !overlay) return;
    sideMenu.classList.remove("open");
    overlay.classList.remove("show");
  }

  function goToPage(page) {
    const session = resolveSession();
    localStorage.setItem("session", session);
    window.location.href = `${page}?session=${encodeURIComponent(session)}`;
  }

  function initSharedMenu() {
    const sideMenu = document.getElementById("sideMenu");
    const overlay = document.getElementById("overlay");
    renderMenu(sideMenu);
    if (overlay) {
      overlay.onclick = closeMenu;
      // Keep overlay above page headers/topbars.
      overlay.style.zIndex = "4900";
    }
    if (sideMenu) {
      // Keep menu above page headers/topbars so first items are not hidden.
      sideMenu.style.zIndex = "5000";
    }

    // Expose globals used by existing inline onclick attributes.
    window.toggleMenu = toggleMenu;
    window.closeMenu = closeMenu;
    window.goToPage = goToPage;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSharedMenu);
  } else {
    initSharedMenu();
  }
})();
