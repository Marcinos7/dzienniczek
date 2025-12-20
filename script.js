// KATEGORIE UWAG
const KATEGORIE_UWAG = [
  "wypełnianie obowiązków ucznia",
  "zaangażowanie społeczne",
  "kultura osobista",
  "dbałość o bezpieczeństwo i zdrowie",
  "szacunek do innych osób",
  "zachowanie na lekcji"
];

// GODZINY LEKCJI
const godzinyLekcji = [
  "7:10-7:55", "8:00-8:45", "8:55-9:40", "9:50-10:35",
  "10:45-11:30", "11:45-12:30", "12:50-13:35", "13:40-14:25", "14:30-15:15"
];

let wybranaLekcjaIndex = null;
let wybranyDzien = null;
let wybranyPrzedmiot = null;

// Wczytanie planu lekcji
document.getElementById("loadPlanBtn").addEventListener("click", () => {
  const dzien = document.getElementById("daySelect").value;
  loadPlanLekcji(dzien);
});

function loadPlanLekcji(dzien) {
  const tbody = document.getElementById("planTableBody");
  tbody.innerHTML = "<tr><td colspan='3'>Ładowanie...</td></tr>";

  db.collection("planLekcji").doc(dzien).get()
    .then(docSnap => {
      if (!docSnap.exists) {
        tbody.innerHTML = "<tr><td colspan='3'>Brak planu</td></tr>";
        return;
      }

      const data = docSnap.data();
      let html = "";

      for (let i = 0; i < godzinyLekcji.length; i++) {
        const przedmiot = data[i.toString()] || "-";
        html += `<tr onclick="selectLesson(this, '${przedmiot}')">
          <td>${i}</td>
          <td>${godzinyLekcji[i]}</td>
          <td>${przedmiot}</td>
        </tr>`;
      }

      tbody.innerHTML = html;
    })
    .catch(err => {
      console.error("Błąd Firestore:", err);
      tbody.innerHTML = "<tr><td colspan='3'>Błąd ładowania</td></tr>";
    });
}

// Kliknięcie w lekcję
function selectLesson(row, przedmiot) {
  document.querySelectorAll(".plan-table tbody tr").forEach(r => r.classList.remove("active"));
  row.classList.add("active");

  wybranaLekcjaIndex = row.cells[0].textContent;
  wybranyDzien = document.getElementById("daySelect").value;
  wybranyPrzedmiot = przedmiot;

  // Wypełnij modal
  document.getElementById("modalNauczyciel").value = userName.textContent;
  document.getElementById("modalPrzedmiot").value = przedmiot;
  document.getElementById("modalTemat").value = "";

  document.getElementById("lessonModal").style.display = "flex";
}

// Anuluj modal
document.getElementById("cancelLessonBtn").addEventListener("click", () => {
  document.getElementById("lessonModal").style.display = "none";
});

// Zapis realizacji lekcji
document.getElementById("saveLessonBtn").addEventListener("click", () => {
  const temat = document.getElementById("modalTemat").value;
  const nauczyciel = document.getElementById("modalNauczyciel").value;

  if(!temat) return alert("Wpisz temat lekcji!");

  db.collection("planLekcji").doc(wybranyDzien)
    .collection("realizacja").doc(`lekcja${wybranaLekcjaIndex}`)
    .set({
      temat: temat,
      nauczyciel: nauczyciel,
      godzina: wybranaLekcjaIndex,
      przedmiot: wybranyPrzedmiot
    })
    .then(() => {
      alert("Zapisano realizację!");
      document.getElementById("lessonModal").style.display = "none";
      loadPlanLekcji(wybranyDzien); // odśwież tabelę
    })
    .catch(err => alert("Błąd zapisu: " + err));
});


// KONFIGURACJA FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyCpZFyGA92f5600MVKWYhOsJ0eXhKAN0DA",
  authDomain: "dzienniczek-a488a.firebaseapp.com",
  projectId: "dzienniczek-a488a",
  storageBucket: "dzienniczek-a488a.firebasestorage.app",
  messagingSenderId: "194419034610",
  appId: "1:194419034610:web:132c6597ce9b750896436b"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ELEMENTY DOM
const loginDiv = document.getElementById('loginDiv');
const dashboardDiv = document.getElementById('dashboardDiv');
const dziennikDiv = document.getElementById('dziennikDiv');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginError = document.getElementById('loginError');
const userName = document.getElementById('userName');
const userName2 = document.getElementById('userName2');
const openDziennikBtn = document.getElementById('openDziennikBtn');
const backToDashboardBtn = document.getElementById('backToDashboardBtn');

const klasaSelect = document.getElementById('klasaSelect');
const zaladujKlaseBtn = document.getElementById('zaladujKlase');
const paneleDiv = document.getElementById('panele');
const panelContent = document.getElementById('panelContent');
const panelBtns = document.querySelectorAll('.panelBtn');

let aktualnaKlasa = null;

// LOGOWANIE
loginBtn.addEventListener('click', () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  auth.signInWithEmailAndPassword(email,password)
    .then(userCred => loadTeacherData(userCred.user.uid))
    .catch(err => loginError.textContent = err.message);
});
// Logowanie po kliknięciu przycisku


// Logowanie po wciśnięciu Enter w polu hasła
document.getElementById('password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        loginBtn.click();
    }
});

// Opcjonalnie: żeby działało też w polu email
document.getElementById('email').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        loginBtn.click();
    }
});

// =======================
// LOADER „PROSZĘ CZEKAĆ…”
// =======================

let loadingStartTime = 0;

function showLoading(text = "Proszę czekać…") {
  loadingStartTime = Date.now();

  let overlay = document.getElementById("loadingOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "loadingOverlay";
    overlay.innerHTML = `
      <div class="loaderBox">
        <div class="spinner"></div>
        <p id="loadingText">${text}</p>
      </div>
    `;
    document.body.appendChild(overlay);
  } else {
    // tylko gdy overlay już istnieje
    const loadingTextElem = overlay.querySelector("#loadingText");
    if (loadingTextElem) loadingTextElem.textContent = text;
  }

  overlay.style.display = "flex";
}


function hideLoading() {
  const minTime = 300; // minimalny czas – brak jumpscare
  const elapsed = Date.now() - loadingStartTime;
  const delay = Math.max(minTime - elapsed, 0);

  setTimeout(() => {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) overlay.style.display = "none";
  }, delay);
}


// WYLOGOWANIE
logoutBtn.addEventListener('click', ()=> location.reload());

// PO ZALOGOWANIU
function loadTeacherData(uid){
  db.collection("nauczyciele").doc(uid).get().then(doc=>{
    if(!doc.exists){alert("Brak danych nauczyciela!"); return;}
    const data = doc.data();
    userName.textContent = data.imie;
    userName2.textContent = data.imie;

    // DASHBOARD
    loginDiv.style.display='none';
    dashboardDiv.style.display='flex';

    // ZAŁADUJ WSZYSTKIE KLASy
    klasaSelect.innerHTML='<option value="">-- Wybierz --</option>';
    db.collection("klasy").get().then(snapshot=>{
      snapshot.forEach(doc=>{
        const opt=document.createElement('option');
        opt.value=doc.id;
        opt.textContent=doc.id;
        klasaSelect.appendChild(opt);
      });
    });

    // ZAŁADUJ IMIENINY Z API
    fetch('https://api.abalin.net/today?country=pl')
      .then(r=>r.json())
      .then(d=>{
        const ul = document.getElementById('imieninyList');
        ul.innerHTML = '';
        if(d && d.data && d.data.namedays && d.data.namedays.pl){
          const names = d.data.namedays.pl.split(', ');
          names.forEach(n=>{
            const li = document.createElement('li');
            li.textContent = n;
            ul.appendChild(li);
          });
        } else {
          ul.innerHTML = '<li>Brak danych</li>';
        }
      });
  });
}

// PRZEJŚCIE DO DZINNIKA
openDziennikBtn.addEventListener('click', ()=>{
  dashboardDiv.style.display='none';
  dziennikDiv.style.display='flex';
});

// POWRÓT DO DASHBOARD
backToDashboardBtn.addEventListener('click', ()=>{
  dziennikDiv.style.display='none';
  dashboardDiv.style.display='flex';
});

// ZAŁADUJ KLASĘ
zaladujKlaseBtn.addEventListener('click',()=>{
  const klasa = klasaSelect.value;
  if(!klasa) return alert("Wybierz klasę!");
  aktualnaKlasa = klasa;
  paneleDiv.style.display='block';
  panelContent.innerHTML="<p>Załaduj 'Realizacja zajęć', aby odblokować resztę paneli.</p>";
});

// PANELE
panelBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    showLoading("Ładowanie panelu…");

    const panel = btn.dataset.panel;
    panelContent.innerHTML = "";

    loadPanelData(panel, true)
      .finally(() => hideLoading());
  });
});


// ŁADOWANIE PANELI
function loadRealizacjaPanel() {
  if (!aktualnaKlasa) return;

  const panelContent = document.getElementById("panelContent");
  panelContent.innerHTML = "<h2>Realizacja zajęć</h2>";

  db.collection("klasy").doc(aktualnaKlasa).collection("realizacja").get()
    .then(snapshot => {
      if (snapshot.empty) {
        panelContent.innerHTML += "<p>Brak lekcji.</p>";
        return;
      }

      let html = `<table>
        <tr>
          <th>Data</th>
          <th>Przedmiot</th>
          <th>Nauczyciel</th>
          <th>Temat</th>
          <th>Godzina lekcyjna</th>
          <th>Akcja</th>
        </tr>`;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        html += `<tr>
          <td>${doc.id}</td>
          <td>${data.przedmiot || ""}</td>
          <td>${data.nauczyciel || ""}</td>
          <td><input type="text" id="temat_${doc.id}" value="${data.temat || ""}"></td>
          <td>${data.godzina || ""}</td>
          <td><button onclick="saveRealizacja('${doc.id}')">Zapisz</button></td>
        </tr>`;
      });

      html += "</table>";
      panelContent.innerHTML += html;
    });
}

function saveRealizacja(docId) {
  const temat = document.getElementById(`temat_${docId}`).value;
  db.collection("klasy").doc(aktualnaKlasa).collection("realizacja").doc(docId)
    .update({ temat })
    .then(() => alert("Zapisano!"))
    .catch(err => alert("Błąd: " + err));
}



// ZAPIS
function saveDoc(panel, docId){
  const val=document.getElementById(`data_${docId}`).value;
  let data;
  try{data=JSON.parse(val);}catch(e){return alert("Niepoprawny format JSON!");}
  db.collection("klasy").doc(aktualnaKlasa).collection(panel).doc(docId).set(data)
  .then(()=>alert("Zapisano!"))
  .catch(err=>alert("Błąd: "+err));
}

function loadRealizacja() {
    db.collection("klasy").doc(aktualnaKlasa).collection("realizacja").get()
    .then(snapshot => {
        if(snapshot.empty){
            panelContent.innerHTML = "<p>Brak przedmiotów.</p>";
            return;
        }

        let html = '';

        snapshot.docs.forEach(subjDoc => {
            const przedmiot = subjDoc.id;
            html += `<h3>${przedmiot}</h3>`;
            html += `<table class="realizacja-table">
            <tr>
                <th>Data</th>
                <th>Temat</th>
                <th>Godzina lekcyjna</th>
                <th>Akcja</th>
            </tr>`;

            db.collection("klasy").doc(aktualnaKlasa)
              .collection("realizacja").doc(przedmiot)
              .collection("daty").orderBy("data", "desc").get()
            .then(docsSnap => {
                docsSnap.forEach(doc => {
                    const data = doc.data();
                    html += `<tr>
                        <td>${doc.id}</td>
                        <td><input type="text" id="temat_${przedmiot}_${doc.id}" value="${data.temat || ''}"></td>
                        <td><input type="text" id="godzina_${przedmiot}_${doc.id}" value="${data.godzina || ''}"></td>
                        <td><button onclick="saveRealizacja('${przedmiot}','${doc.id}')">Zapisz</button></td>
                    </tr>`;
                });
                html += `</table><button onclick="dodajDzien('${przedmiot}')">Dodaj nowy dzień</button>`;
                panelContent.innerHTML += html;
            });
        });
    });
}

function saveRealizacja(przedmiot, docId){
    const data = {
        temat: document.getElementById(`temat_${przedmiot}_${docId}`).value,
        godzina: document.getElementById(`godzina_${przedmiot}_${docId}`).value
    };
    db.collection("klasy").doc(aktualnaKlasa)
      .collection("realizacja").doc(przedmiot)
      .collection("daty").doc(docId)
      .set(data)
      .then(()=> alert("Zapisano!"))
      .catch(err => alert("Błąd: "+err));
}

function dodajDzien(przedmiot){
    const newDate = prompt("Podaj datę (YYYY-MM-DD):");
    if(newDate){
        db.collection("klasy").doc(aktualnaKlasa)
          .collection("realizacja").doc(przedmiot)
          .collection("daty").doc(newDate)
          .set({temat:'', godzina:''})
          .then(() => loadRealizacja());
    }
}

