
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

//KUPA OGÓLNA




// ==========================================
// SYSTEM ZARZĄDZANIA LEKCJĄ - LOGIKA
// ==========================================

const sekcjaStep1 = document.getElementById('step-1');
const sekcjaStep2 = document.getElementById('step-2');
const sekcjaStep3 = document.getElementById('step-3');
const sekcjaStep4 = document.getElementById('step-4');
const sekcjaStep5 = document.getElementById('step-5');

const guzikStartOceny = document.getElementById('btn-start');
const listaKlasOceny = document.getElementById('select-klasa');

let wybranaKlasaDlaOcen = "";
let aktywnyPrzedmiot = "";
let aktywnyNumerLekcji = "";

// 1. Ładowanie klas
if (guzikStartOceny) {
    guzikStartOceny.addEventListener('click', () => {
        if(listaKlasOceny) listaKlasOceny.innerHTML = '<option value="">-- wybierz --</option>';
        db.collection("klasy").get()
            .then((snapshot) => {
                snapshot.forEach((doc) => {
                    let opt = document.createElement('option');
                    opt.value = doc.id;
                    opt.textContent = doc.id;
                    listaKlasOceny.appendChild(opt);
                });
                if(sekcjaStep1) sekcjaStep1.style.display = 'none';
                if(sekcjaStep2) sekcjaStep2.style.display = 'block';
            })
            .catch(err => console.error("Błąd klas:", err));
    });
}

// 2. Wybór klasy
if (listaKlasOceny) {
    listaKlasOceny.addEventListener('change', (e) => {
        if(e.target.value) {
            wybranaKlasaDlaOcen = e.target.value;
            if(sekcjaStep3) sekcjaStep3.style.display = 'block';
        }
    });
}

// 3. Wybór dnia i pobieranie planu
document.querySelectorAll('.day-btn').forEach(btnDnia => {
    btnDnia.addEventListener('click', (e) => {
        const dzienTygodnia = e.target.getAttribute('data-day');
        const listaLekcjiHtml = document.getElementById('lesson-list');
        
        if(listaLekcjiHtml) listaLekcjiHtml.innerHTML = "<li>Ładowanie...</li>";
        if(sekcjaStep4) sekcjaStep4.style.display = 'block';

        db.collection("planLekcji").doc(dzienTygodnia).get()
            .then(docSnap => {
                if (docSnap.exists) {
                    const danePlanu = docSnap.data();
                    listaLekcjiHtml.innerHTML = "";
                    const numeryLekcji = Object.keys(danePlanu).sort((a, b) => Number(a) - Number(b));

                    numeryLekcji.forEach(nr => {
                        let li = document.createElement('li');
                        li.style.padding = "10px";
                        li.style.borderBottom = "1px solid #ddd";
                        li.innerHTML = `
                            <strong>Lekcja ${nr}:</strong> ${danePlanu[nr]} 
                            <button onclick="wybierzLekcjeDoOcen('${danePlanu[nr]}', '${nr}')" style="float:right; cursor:pointer;">
                                Wybierz
                            </button>
                        `;
                        listaLekcjiHtml.appendChild(li);
                    });
                } else {
                    listaLekcjiHtml.innerHTML = `<li>Brak dokumentu "${dzienTygodnia}" w kolekcji planLekcji.</li>`;
                }
            })
            .catch(err => console.error("Błąd planu:", err));
    });
});

// 4. FUNKCJA WYBORU LEKCJI (Menu Modułów)
window.wybierzLekcjeDoOcen = function(przedmiot, nr) {
    aktywnyPrzedmiot = przedmiot;
    aktywnyNumerLekcji = nr;

    // Ustawienie nagłówka w menu
    const tytul = document.getElementById('info-lekcja-tytul');
    if(tytul) tytul.textContent = `Lekcja ${nr}: ${przedmiot} (Klasa ${wybranaKlasaDlaOcen})`;

    // Pokaż krok 5 (wybór panelu)
    if(sekcjaStep5) {
        sekcjaStep5.style.display = 'block';
        sekcjaStep5.scrollIntoView({ behavior: 'smooth' });
    }
};

// 5. Obsługa nawigacji wewnątrz lekcji
document.querySelectorAll('.panel-nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const cel = e.target.getAttribute('data-target');
        
        // Tutaj będziemy podpinać konkretne funkcje w przyszłości
        console.log(`Przejście do: ${cel} | Klasa: ${wybranaKlasaDlaOcen} | Przedmiot: ${aktywnyPrzedmiot}`);
        
        alert(`Wybrałeś panel: ${cel.toUpperCase()}\nKlasa: ${wybranaKlasaDlaOcen}\nLekcja: ${aktywnyPrzedmiot}`);
    });
});
// --- DODATKOWE ZMIENNE ---
const sekcjaStep6 = document.getElementById('step-6-oceny');

// Obsługa przycisku "Oceny" w Kroku 5
document.querySelector('[data-target="oceny"]').addEventListener('click', () => {
    // 1. Ukrywamy poprzednie kroki
    document.querySelectorAll('[id^="step-"]').forEach(s => s.style.display = 'none');
    
    // 2. Pokazujemy panel ocen
    sekcjaStep6.style.display = 'block';

    // 3. Automatyczna data (YYYY-MM-DD)
    const dzis = new Date().toISOString().split('T')[0];
    document.getElementById('ocena-data').value = dzis;
});

// GENEROWANIE TABELI UCZNIÓW
document.getElementById('btn-generuj-tabele').addEventListener('click', () => {
    const temat = document.getElementById('ocena-temat').value;
    if(!temat) return alert("Musisz wpisać temat oceny!");

    const tbody = document.getElementById('lista-uczniow-oceny');
    tbody.innerHTML = "<tr><td colspan='4'>Ładowanie listy uczniów...</td></tr>";
    document.getElementById('tabela-uczniow-kontener').style.display = 'block';

    console.log("Próba pobrania uczniów dla klasy:", wybranaKlasaDlaOcen);
    
    // ŚCIEŻKA: klasy -> {wybranaKlasaDlaOcen} -> uczniowie
    // Upewnij się, że w Firebase kolekcja nazywa się "uczniowie" (małymi literami)
    db.collection("klasy").doc(wybranaKlasaDlaOcen).collection("uczniowie").get()
        .then(snapshot => {
            console.log("Czy kolekcja istnieje?", !snapshot.empty);
            console.log("Liczba znalezionych dokumentów:", snapshot.size);

            tbody.innerHTML = "";
            
            if(snapshot.empty) {
                tbody.innerHTML = "<tr><td colspan='4'>Brak uczniów. Sprawdź konsolę (F12)!</td></tr>";
                console.warn("UWAGA: Firebase nie znalazł nic w ścieżce: klasy /", wybranaKlasaDlaOcen, "/ uczniowie");
                return;
            }

            snapshot.forEach(docStudent => {
                const u = docStudent.data();
                console.log("Wczytano ucznia:", u); // Zobaczysz czy pola imie/nazwisko się zgadzają

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${u.numer || '?'}</td>
                    <td>${u.imie || ''} ${u.nazwisko || ''}</td>
                    <td>
                        <select class="ocena-input" data-uid="${docStudent.id}">
                            <option value="">brak</option>
                            <option value="6">6</option>
                            <option value="5">5</option>
                            <option value="4">4</option>
                            <option value="3">3</option>
                            <option value="2">2</option>
                            <option value="1">1</option>
                            <option value="np">np</option>
                            <option value="nb">nb</option>
                        </select>
                    </td>
                    <td><input type="text" class="komentarz-input" placeholder="notatka..." data-uid="${docStudent.id}"></td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => {
            console.error("Błąd krytyczny Firestore:", err);
            tbody.innerHTML = `<tr><td colspan='4'>Błąd: ${err.message}</td></tr>`;
        });
});

// Funkcja powrotu
window.backToMenu = function() {
    sekcjaStep6.style.display = 'none';
    document.getElementById('step-5').style.display = 'block';
};
document.getElementById('btn-zapisz-wszystkie-oceny').addEventListener('click', async () => {
    const temat = document.getElementById('ocena-temat').value;
    const dataOceny = document.getElementById('ocena-data').value;
    const ocenyInputs = document.querySelectorAll('.ocena-input');
    const komentarzeInputs = document.querySelectorAll('.komentarz-input');

    if (!temat) return alert("Musisz wpisać temat, aby stworzyć dokument oceny!");

    // Przygotowujemy obiekt, w którym zapiszemy wszystkie oceny
    // format: { "u1": "5", "u2": "3" }
    let mapaOcen = {};
    let mapaKomentarzy = {};
    let licznik = 0;

    ocenyInputs.forEach((select, index) => {
        const studentUid = select.getAttribute('data-uid'); // u1, u2...
        const ocenaWartosc = select.value;
        const komentarz = komentarzeInputs[index].value;

        if (ocenaWartosc !== "") {
            mapaOcen[studentUid] = ocenaWartosc;
            if (komentarz) {
                mapaKomentarzy[studentUid] = komentarz;
            }
            licznik++;
        }
    });

    if (licznik === 0) return alert("Nie wpisano żadnych ocen!");

    // Referencja do JEDNEGO dokumentu o nazwie tematu
    // Używamy .set(), żeby stworzyć lub nadpisać ten temat
    db.collection("klasy")
      .doc(wybranaKlasaDlaOcen)
      .collection("oceny")
      .doc(temat) // Dokument nazywa się tak jak temat
      .set({
          data: dataOceny,
          przedmiot: aktywnyPrzedmiot,
          nauczyciel: userName.textContent,
          oceny: mapaOcen,       // Wszystkie oceny w jednym polu
          komentarze: mapaKomentarzy,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
      })
      .then(() => {
          alert(`Zapisano kolumnę ocen: ${temat} (${licznik} ocen)`);
          wyczyscPanelOcen(); // <--- CZYŚCIMY TUTAJ
          backToMenu();
      })
      .catch(err => {
          console.error("Błąd zapisu:", err);
          alert("Błąd: " + err.message);
      });
});
function wyczyscPanelOcen() {
    // 1. Czyścimy temat
    const inputTemat = document.getElementById('ocena-temat');
    if (inputTemat) inputTemat.value = "";

    // 2. Czyścimy listę uczniów (usuwamy wiersze)
    const tbody = document.getElementById('lista-uczniow-oceny');
    if (tbody) tbody.innerHTML = "";

    // 3. Ukrywamy kontener tabeli
    const kontenerTabeli = document.getElementById('tabela-uczniow-kontener');
    if (kontenerTabeli) kontenerTabeli.style.display = 'none';

    console.log("Panel ocen został wyczyszczony.");
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

