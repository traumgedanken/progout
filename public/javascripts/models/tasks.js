const searchEl = document.getElementById('search');
const loaderEl = document.getElementById('loader');
const paginationEl = document.getElementById('pagination');
const tableEl = document.getElementById('table');

async function fetchData(page) {
    let url = '/api/v1/tasks?';
    if (page) url += `page=${page}&`;

    const search = searchEl ? searchEl.value : null;
    if (search) url += `search=${search}&`;

    if (localStorage.courseId != 'null') url += `course=${localStorage.courseId}`;
    return JSON.parse(await (await fetch(url)).text());
}

async function renderPagination(count) {
    const templateStr = await (await fetch('/templates/pagination.mst')).text();
    const data = {
        currentPage: localStorage.currentPage,
        pages: count ? Math.ceil(count / 5) : 0
    };
    if (count) {
        if (data.currentPage != 1) data.prevPage = parseInt(localStorage.currentPage) - 1;
        if (data.currentPage != data.pages) data.nextPage = parseInt(localStorage.currentPage) + 1;
    }
    const htmlStr = await Mustache.render(templateStr, data);
    paginationEl.innerHTML = htmlStr;
}

async function renderTable() {
    loaderEl.style.display = 'block';
    const templateStr = await (await fetch('/templates/tasks.mst')).text();
    const content = await fetchData(localStorage.currentPage);
    const htmlStr = await Mustache.render(templateStr, {
        list: content.tasks,
        pages: content.count ? Math.ceil(content.count / 5) : 0,
        request: searchEl ? searchEl.value : null
    });
    tableEl.innerHTML = htmlStr;
    await renderPagination(content.count);
    loaderEl.style.display = 'none';
}

window.onload = () => {
    const courseEl = document.getElementById('courseId');
    localStorage.courseId = courseEl ? courseEl.innerHTML : null;
    localStorage.currentPage = 1;
    renderTable();
};

async function goToPrevPage() {
    localStorage.currentPage--;
    await renderTable();
}

async function goToNextPage() {
    localStorage.currentPage++;
    await renderTable();
}

async function processInput() {
    localStorage.currentPage = 1;
    await renderTable();
}
