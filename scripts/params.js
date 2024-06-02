// params.js

function getQueryParams() {
    let params = {};
    window.location.search.substring(1).split("&").forEach(pair => {
        let [key, value] = pair.split("=");
        params[key] = value;
    });
    return params;
}

const params = getQueryParams();

export { params };