async function fetchData(page) {
    let url = "/api/v1/users";
    if (page) url += `?page=${page}`;
    return JSON.parse(await (await fetch(url)).text());
}

async function renderPagination(count) {
    const templateStr = await (await fetch("/templates/pagination.mst")).text();
    const data = { currentPage: localStorage.currentPage, pages: count ? Math.ceil(count / 5) : 0 };
    if (data.currentPage != 1) data.prevPage = parseInt(localStorage.currentPage) - 1;
    if (data.currentPage != data.pages) data.nextPage = parseInt(localStorage.currentPage) + 1;
    const htmlStr = await Mustache.render(templateStr, data);
    document.getElementById("pagination").innerHTML = htmlStr;
}

async function renderTable() {
    const templateStr = await (await fetch("/templates/users.mst")).text();
    const content = await fetchData(localStorage.currentPage);
    const htmlStr = await Mustache.render(templateStr, {
        list: content.users,
        pages: content.count ? Math.ceil(content.count / 5) : 0
    });
    document.getElementById("table").innerHTML = htmlStr;
    await renderPagination(content.count);
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
