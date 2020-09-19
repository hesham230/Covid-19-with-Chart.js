const chartContainer = document.querySelector(".chart");
const countriesList = document.querySelector("select#countries");
const countriesData = document.querySelector(".countries-data");
const spinner = document.querySelector(".spinner");
const countries = document.querySelector(".countries");
 
 // Chart initialization
function creatNewChart(data, info, continent) {
  const chart = document.createElement("canvas");
  chart.setAttribute("id", "#covidChart");
  chartContainer.appendChild(chart);
  myChart = new Chart(chart, {
    type: "line",
    data: {
      labels: data.dataLabels,
      datasets: [
        {
          label: `${info} in ${continent}`,
          backgroundColor: "blue",
          borderColor: "#333",
          borderWidth: "1",
          data: data.dataValues,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
            },
          },
        ],
      },
    },
  });
  return chart;
}

const replaceData = (arrLabel, arrData, type, region) =>{
  myChart.data.labels = arrLabel;
  myChart.data.datasets[0].data = arrData;
  myChart.data.datasets[0].label = `${type} in ${region}`;
  myChart.update();
}

let defaultCase = {
  infoType: "confirmed",
  continent: "world",
};


const getUrl = {
  proxy: "https://api.allorigins.win/raw?url=",

  coronaApi() {
    return "https://corona-api.com/countries";
  },

  coronaApiCountry(countryCode) {
    return `https://corona-api.com/countries/${countryCode}`;
  },

  allCountries() {
    return `${this.proxy}https://restcountries.herokuapp.com/api/v1`;
  },

  countriesRegion(continentName) {
    return `${this.proxy}https://restcountries.herokuapp.com/api/v1/region/${continentName}`;
  },
};

const createButtons = (name, innerText, btnType) =>{
  const btn = document.createElement("button");
  btn.classList.add("btn");
  btn.setAttribute("type", "button");
  btn.setAttribute("name", name);
  btn.setAttribute("data-btnType", btnType);
  btn.innerText = innerText;
  btn.addEventListener("click", handleClick);
  document.querySelector(`.${btnType}`).appendChild(btn);
}

const groupBtns = (array, btnType) =>{
  array.forEach((button) => {
    const innerText = button[0].toUpperCase() + button.substring(1);
    createButtons(button, innerText, btnType);
  });
}

const fillCountries = (countries) =>{
  countriesList.addEventListener("change", selectCountry);
  countriesList.innerHTML =
    '<option value="SelectOption" selected>-- Select Country --</option>';
  for (const country of countries) {
    const html = `<option value="${country}">${country}</option>`;
    countriesList.insertAdjacentHTML("beforeend", html);
  }
}

async function handleClick(event) {
  spinner.classList.remove("hidden");
  const btnName = event.currentTarget.getAttribute("name");
  const btnType = event.currentTarget.getAttribute("data-btnType");
  countriesData.classList.add("hidden");
  if (btnType === "infoType") {
    defaultCase.infoType = btnName;
  }
  if (btnType === "continent") {
    defaultCase.continent = btnName;
  }
  const newData = await createChartData(
    defaultCase.continent,
    defaultCase.infoType
  );
  updateChart(newData);
  spinner.classList.add("hidden");
}

const updateChart = (newData) =>{
  replaceData(
    newData.dataLabels,
    newData.dataValues,
    defaultCase.infoType,
    defaultCase.continent
  );
}
const selectCountry = (event) =>{
  spinner.classList.remove("hidden");
  const chosenCountry = event.target.value;
  countriesData.classList.remove("hidden");
  displayCountryData(chosenCountry);
  spinner.classList.add("hidden");
}
async function displayCountryData(chosenCountryName) {
  const countryIndex = currentData.dataLabels.findIndex(
    (countryName) => countryName === chosenCountryName
  );
  const countryCode = currentData.dataCode[countryIndex];
  const countryData = await getCountryData(countryCode);
  const countryObj = createCountryObj(countryData);
  const html = `
<h2>${countryObj.name}</h2>
<div>
<h4>Confirmed Cases: ${countryObj.confirmed}</h4>
<h4>Critical Cases: ${countryObj.critical}</h4>
<h4>Deaths: ${countryObj.deaths}</h4>
<h4>Recovered: ${countryObj.recovered}</h4>
</div>`;
countriesData.innerHTML = html;
}

const createCountryObj = (countryData) =>{
  if (countryData) {
    const countryObj = {
      name: countryData.data.name,
      code: countryData.data.code,
      confirmed: countryData.data.latest_data.confirmed,
      newConfirmed: countryData.data.today.confirmed,
      critical: countryData.data.latest_data.critical,
      deaths: countryData.data.latest_data.deaths,
      newDeaths: countryData.data.today.deaths,
      recovered: countryData.data.latest_data.recovered,
    };
    return countryObj;
  }
}

async function onLoad() {
  spinner.classList.remove("hidden");

  const chartTypes = [
    "confirmed",
    "critical",
    "deaths",
    "recovered",
  ];
  groupBtns(chartTypes, "infoType");
  
  const continents = [
    "Asia",
    "Europe",
    "Africa",
    "Americas",
    "world",
  ];
  groupBtns(continents, "continent");
  currentData = await createChartData("world", "confirmed");
  covidChartElement = creatNewChart(currentData, "confirmed", "world");
  spinner.classList.add("hidden");
}

async function fetchUrl(url) {
  if (parseInt((response = await fetch(url)).status) !== 404) {
    const data = await response.json();
    return data;
  } else return false;
}
async function getCountryData(countryCode) {
  const url = getUrl.coronaApiCountry(countryCode);
  return await fetchUrl(url);
}

async function createChartData(continent, infoType) {
  spinner.classList.remove("hidden");
  let dataLabelsArray = [];
  let dataValuesArray = [];
  let dataCodeArray = [];
  if (continent === "world") {
    const worldCoronaUrl = getUrl.coronaApi();
    const continentFullCoronaData = await fetchUrl(worldCoronaUrl);
    for (let country of continentFullCoronaData.data) {
      dataCodeArray.push(country.code);
      dataLabelsArray.push(country.name);
      dataValuesArray.push(country.latest_data[infoType]);
    }
  } else {
    const countryCodesUrl = getUrl.countriesRegion(continent);
    const continentAllCodes = await fetchUrl(countryCodesUrl);
    for (let country of continentAllCodes) {
      const code = country.cca2;
      countryCoronaData = await getCountryData(code);
      if (countryCoronaData) {
        dataCodeArray.push(code);
        dataLabelsArray.push(countryCoronaData.data.name);
        dataValuesArray.push(
          countryCoronaData.data.latest_data[infoType]
        );
      }
    }
  }

  fillCountries(dataLabelsArray);

  spinner.classList.add("hidden");

  return {
    dataCode: dataCodeArray,
    dataLabels: dataLabelsArray,
    dataValues: dataValuesArray,
  };
}

window.addEventListener("load", onLoad);
