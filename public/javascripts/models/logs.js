const loaderEl = document.getElementById('loader');
const paginationEl = document.getElementById('pagination');
const tableEl = document.getElementById('table');

async function fetchData(page) {
    let url = '/api/v1/logs?offset=10';
    if (page) url += `&page=${page}`;
    return JSON.parse(await (await fetch(url)).text());
}

async function renderPagination(count) {
    const templateStr = await (await fetch('/templates/pagination.mst')).text();
    const data = {
        currentPage: localStorage.currentPage,
        pages: count ? Math.ceil(count / 10) : 0
    };
    if (data.currentPage != 1) data.prevPage = parseInt(localStorage.currentPage) - 1;
    if (data.currentPage != data.pages) data.nextPage = parseInt(localStorage.currentPage) + 1;
    const htmlStr = await Mustache.render(templateStr, data);
    paginationEl.innerHTML = htmlStr;
}

async function renderTable() {
    loaderEl.style.display = 'block';
    const templateStr = await (await fetch('/templates/logs.mst')).text();
    const content = await fetchData(localStorage.currentPage);
    const htmlStr = await Mustache.render(templateStr, {
        list: content.logs,
        pages: content.count ? Math.ceil(content.count / 10) : 0
    });
    tableEl.innerHTML = htmlStr;
    await renderPagination(content.count);
    loaderEl.style.display = 'none';
}

window.onload = () => {
    localStorage.currentPage = 1;
    renderTable();
};

function goToPrevPage() {
    localStorage.currentPage--;
    renderTable();
}

function goToNextPage() {
    localStorage.currentPage++;
    renderTable();
}
