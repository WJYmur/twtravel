/**
 * 繪製互動式台灣地圖 / Draw interactive Taiwan Map
 */
export async function initTaiwanMap() {
    const d3 = window.d3;
    const width = 600;
    const height = 750;
    const svg = d3.select("#taiwanMap").append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .classed("w-full h-full", true);

    // 設定地圖投影與路徑產生器 / Set map projection and path generator
    const projection = d3.geoMercator();
    const path = d3.geoPath().projection(projection);
    const tooltipDiv = d3.select("#mapTooltip");

    // 提示框控制函數 / Tooltip control functions
    function showTooltip(event, text) { tooltipDiv.style("opacity", 1).text(text); }
    function moveTooltip(event) { tooltipDiv.style("left", (event.pageX + 15) + "px").style("top", (event.pageY + 15) + "px"); }
    function hideTooltip() { tooltipDiv.style("opacity", 0); }

    // 縣市配色方案 / County color palette
    const colors = [
        "#FCA5A5", "#FDBA74", "#FCD34D", "#D9F99D", "#86EFAC",
        "#34D399", "#6EE7B7", "#5EEAD4", "#7DD3FC", "#38BDF8",
        "#93C5FD", "#818CF8", "#A78BFA", "#C4B5FD", "#E879F9",
        "#F472B6", "#FB923C", "#FEF08A", "#A3E635", "#4ADE80",
        "#F87171", "#FBBF24"
    ];
    const colorScale = d3.scaleOrdinal(colors);

    try {
        // 載入台灣 GeoJSON 資料 / Load Taiwan GeoJSON data
        const response = await fetch("https://raw.githubusercontent.com/g0v/twgeojson/master/json/twCounty2010.geo.json");
        const geojson = await response.json();
        
        // 修正舊版縣市名稱 / Fix legacy county names
        geojson.features.forEach(feature => {
            if (feature.properties.COUNTYNAME === '桃園縣') {
                feature.properties.COUNTYNAME = '桃園市';
            }
            if (feature.properties.name === '桃園縣') {
                feature.properties.name = '桃園市';
            }
        });
        
        // 過濾離島以正確置中本島 / Filter out offshore islands to center main island properly
        const isOffshore = name => ['金門縣', '澎湖縣', '連江縣'].includes(name);
        const mainFeatures = geojson.features.filter(d => !isOffshore(d.properties.name || d.properties.COUNTYNAME));
        
        projection.fitExtent([[110, 20], [width - 20, height - 20]], {type: "FeatureCollection", features: mainFeatures});
        document.getElementById('mapLoading').style.display = 'none';

        // 繪製本島 / Draw main island
        svg.append("g").selectAll("path").data(mainFeatures).enter().append("path")
            .attr("d", path)
            .attr("fill", d => colorScale(d.properties.name || d.properties.COUNTYNAME))
            .attr("stroke", "#ffffff").attr("stroke-width", "0.8")
            .attr("class", "county-path drop-shadow-sm")
            .on("mouseover", (e, d) => showTooltip(e, d.properties.name || d.properties.COUNTYNAME))
            .on("mousemove", moveTooltip)
            .on("mouseout", hideTooltip)
            .on("click", (e, d) => {
                hideTooltip();
                window.navigateToSearch(d.properties.name || d.properties.COUNTYNAME);
            });

        /**
         * 繪製離島小視窗 / Draw inset map for offshore islands
         */
        function drawInset(featureName, x, y, size, label) {
            const feature = geojson.features.find(d => (d.properties.name || d.properties.COUNTYNAME) === featureName);
            if(!feature) return;
            
            const g = svg.append("g").attr("transform", `translate(${x}, ${y})`).attr("class", "inset-group")
                .on("mouseover", (e) => showTooltip(e, featureName))
                .on("mousemove", moveTooltip)
                .on("mouseout", hideTooltip)
                .on("click", () => { hideTooltip(); window.navigateToSearch(featureName); });

            g.append("rect").attr("width", size).attr("height", size).attr("fill", "#f8fafc").attr("stroke", "#cbd5e1").attr("stroke-dasharray", "4,4").attr("rx", 8);
            g.append("text").attr("x", 8).attr("y", 22).attr("font-size", "14px").attr("fill", "#475569").attr("font-weight", "bold").text(label);
            
            const p = d3.geoMercator().fitExtent([[8, 28], [size-8, size-8]], feature);
            g.append("path").datum(feature).attr("d", d3.geoPath().projection(p)).attr("fill", colorScale(featureName)).attr("stroke", "#fff").attr("stroke-width", 0.5);
        }

        // 繪製馬祖、金門、澎湖 / Draw Matsu, Kinmen, Penghu
        drawInset("連江縣", 15, 20, 100, "馬祖");
        drawInset("金門縣", 15, 130, 100, "金門");
        drawInset("澎湖縣", 15, 240, 100, "澎湖");

    } catch (err) {
        document.getElementById('mapLoading').innerHTML = '<span class="text-red-500 font-bold">地圖載入失敗</span>';
    }
}