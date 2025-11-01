// MGNREGA District Dashboard - JavaScript

const API_URL = 'https://api.data.gov.in/resource/1d369aae-155a-4cc8-b7a8-04d4cd5ec2a6?api-key=YOUR_API_KEY&format=json&limit=1000'; // Replace YOUR_API_KEY with actual if needed
const CACHE_KEY = 'mgnrega_data';
const CACHE_TIMESTAMP_KEY = 'mgnrega_timestamp';

let data = [];
let currentDistrict = '';

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('district-search').addEventListener('input', filterDistricts);
    document.getElementById('district-select').addEventListener('change', updateDashboard);
    document.getElementById('read-aloud-btn').addEventListener('click', readAloud);
}

async function loadData() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('API unavailable');
        data = await response.json();
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now());
        document.getElementById('offline-message').classList.add('hidden');
    } catch (error) {
        console.error('API fetch failed, using cache:', error);
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            data = JSON.parse(cached);
            document.getElementById('offline-message').classList.remove('hidden');
        } else {
            // Use sample data if no cache
            data = await fetch('sample-data.json').then(r => r.json());
            document.getElementById('offline-message').classList.remove('hidden');
        }
    }
    populateDistricts();
    updateDashboard();
}

function populateDistricts() {
    const districts = [...new Set(data.records.map(r => r.district))].sort();
    const select = document.getElementById('district-select');
    select.innerHTML = '<option value="">District choose karen</option>';
    districts.forEach(d => {
        const option = document.createElement('option');
        option.value = d;
        option.textContent = d;
        select.appendChild(option);
    });
    // Default to first district
    if (districts.length > 0) {
        select.value = districts[0];
        currentDistrict = districts[0];
    }
}

function filterDistricts() {
    const search = document.getElementById('district-search').value.toLowerCase();
    const options = document.querySelectorAll('#district-select option');
    options.forEach(option => {
        if (option.value.toLowerCase().includes(search)) {
            option.style.display = '';
        } else {
            option.style.display = 'none';
        }
    });
}

function updateDashboard() {
    const select = document.getElementById('district-select');
    currentDistrict = select.value;
    if (!currentDistrict) return;

    const districtData = data.records.find(r => r.district === currentDistrict);
    if (!districtData) return;

    // Update summary
    document.getElementById('workers-number').textContent = districtData.total_workers.toLocaleString();
    document.getElementById('workers-sentence').textContent = `Is mahine me ${districtData.district} me ${districtData.total_workers.toLocaleString()} logon ko kaam mila.`;

    document.getElementById('funds-number').textContent = '₹' + districtData.total_funds.toLocaleString();
    document.getElementById('funds-sentence').textContent = `Is mahine me ${districtData.total_funds.toLocaleString()} rupaye kharch hue.`;

    document.getElementById('jobs-number').textContent = districtData.jobs_created.toLocaleString();
    document.getElementById('jobs-sentence').textContent = `Is mahine me ${districtData.jobs_created.toLocaleString()} logon ko kaam mila.`;

    // Update chart
    updateChart(districtData.trend);

    // Update top 5
    updateTop5();
}

function updateChart(trend) {
    const ctx = document.getElementById('trend-chart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Month -6', 'Month -5', 'Month -4', 'Month -3', 'Month -2', 'Month -1'],
            datasets: [{
                label: 'Jobs Created',
                data: trend,
                borderColor: '#007bff',
                backgroundColor: 'rgba(0,123,255,0.1)',
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updateTop5() {
    const stateData = data.records.filter(r => r.state === 'Uttar Pradesh').sort((a, b) => b.jobs_created - a.jobs_created).slice(0, 5);
    const list = document.getElementById('top5-list');
    list.innerHTML = '';
    stateData.forEach(d => {
        const li = document.createElement('li');
        li.textContent = `${d.district}: ${d.jobs_created.toLocaleString()} jobs`;
        list.appendChild(li);
    });
}

function readAloud() {
    const sentences = [
        document.getElementById('workers-sentence').textContent,
        document.getElementById('funds-sentence').textContent,
        document.getElementById('jobs-sentence').textContent
    ].join('. ');

    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(sentences);
        utterance.lang = 'hi-IN'; // Hindi
        speechSynthesis.speak(utterance);
    } else {
        alert('Speech synthesis not supported in this browser.');
    }
}
