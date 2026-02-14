
// KATEGORIE UWAG
const KATEGORIE_UWAG = [
  "wypełnianie obowiązków ucznia",
  "zaangażowanie społeczne",
  "kultura osobista",
  "dbałość o bezpieczeństwo i zdrowie",
  "szacunek do innych osób",
  "zachowanie na lekcji"
];
// lista przedmiotów
const PRZEDMIOTY = [
  "biologia",
  "chemia",
  "edukacja dla bezpieczeństwa",
  "fizyka",
  "geografia",
  "historia",
  "informatyka",
  "język angielski",
  "język hiszpański",
  "język polski",
  "matematyka",
  "plastyka",
  "religia",
  "wiedza o społeczeństwie",
  "wychowanie fizyczne"
];





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
let wybranaDataProjektu = "";






let obecnaDataKalendarza = new Date();
let wybranaDataDlaProjektu = "";

// 1. Otwieranie panelu projektów
document.querySelector('[data-target="projekty"]').addEventListener('click', () => {
    document.getElementById('step-5').style.display = 'none';
    document.getElementById('step-8-projekty').style.display = 'block';
    
    // RESET PRZYCISKU: Usuwamy wszystkie stare nasłuchiwacze, kopiując przycisk
    const staryBtn = document.getElementById('btn-zapisz-projekt');
    const nowyBtn = staryBtn.cloneNode(true);
    staryBtn.parentNode.replaceChild(nowyBtn, staryBtn);
    
    // Ponowne przypisanie logiki zapisu do czystego przycisku
    inicjujLogikeZapisu();
    
    rysujKalendarz();
});

// 2. Funkcja inicjująca zapis (wywoływana raz przy otwarciu panelu)
function inicjujLogikeZapisu() {
    const btn = document.getElementById('btn-zapisz-projekt');
    
    btn.onclick = async function() {
        const typ = document.getElementById('projekt-typ').value;
        const przedmiot = document.getElementById('projekt-przedmiot').value;
        const tresc = document.getElementById('projekt-tresc').value;

        if(!tresc) return alert("Wpisz treść wydarzenia!");

        // Blokada przycisku
        btn.disabled = true;
        btn.textContent = "Zapisywanie...";

        try {
            await db.collection("klasy")
                .doc(wybranaKlasaDlaOcen)
                .collection("terminarz")
                .add({
                    data: wybranaDataDlaProjektu,
                    typ: typ,
                    przedmiot: przedmiot,
                    tresc: tresc,
                    nauczyciel: userName.textContent,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });

            zamknijModalProjektu();
            rysujKalendarz(); // Odświeżenie widoku
            
        } catch (error) {
            console.error("Błąd zapisu:", error);
            alert("Błąd: " + error.message);
        } finally {
            btn.disabled = false;
            btn.textContent = "Zapisz w kalendarzu";
        }
    };
}

// 3. Funkcja główna rysująca kalendarz miesięczny
async function rysujKalendarz() {
    const cells = document.getElementById('calendar-cells');
    const tytul = document.getElementById('kalendarz-tytul');
    if (!cells) return;
    
    cells.innerHTML = ""; // Czyścimy siatkę

    const rok = obecnaDataKalendarza.getFullYear();
    const miesiac = obecnaDataKalendarza.getMonth();
    
    const nazwyMiesiecy = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];
    tytul.textContent = `${nazwyMiesiecy[miesiac]} ${rok}`;

    const pierwszyDzienMiesiaca = new Date(rok, miesiac, 1).getDay();
    const dniWMiesiacu = new Date(rok, miesiac + 1, 0).getDate();
    
    // Korekta na polski tydzień (Poniedziałek = 0)
    let przesuniecie = pierwszyDzienMiesiaca === 0 ? 6 : pierwszyDzienMiesiaca - 1;

    // Puste kratki na początku miesiąca
    for (let i = 0; i < przesuniecie; i++) {
        let emptyDiv = document.createElement('div');
        emptyDiv.style = "background: #ecf0f1; min-height: 110px; border: 1px solid #bdc3c7;";
        cells.appendChild(emptyDiv);
    }

    // Generowanie kratek dni
    for (let dzien = 1; dzien <= dniWMiesiacu; dzien++) {
        const dataStr = `${rok}-${String(miesiac + 1).padStart(2, '0')}-${String(dzien).padStart(2, '0')}`;
        
        const cell = document.createElement('div');
        cell.style = "background: white; min-height: 110px; padding: 5px; border: 1px solid #bdc3c7; position: relative; overflow-y: auto;";
        cell.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span style="font-weight: bold; color: #34495e;">${dzien}</span>
                <button onclick="otworzModalProjektu('${dataStr}')" style="background: #3498db; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px; padding: 0 5px;">+</button>
            </div>
            <div id="projekty-lista-${dataStr}" style="display: flex; flex-direction: column; gap: 2px;"></div>
        `;
        cells.appendChild(cell);
        wczytajWydarzeniaDlaDnia(dataStr);
    }
}

// 4. Pobieranie i wyświetlanie wydarzeń z usuwaniem
function wczytajWydarzeniaDlaDnia(data) {
    const kontener = document.getElementById(`projekty-lista-${data}`);
    if(!kontener) return;
    kontener.innerHTML = ""; // Czyścimy przed załadowaniem (zapobiega powielaniu widoku)

    db.collection("klasy").doc(wybranaKlasaDlaOcen).collection("terminarz")
      .where("data", "==", data).get()
      .then(snapshot => {
          snapshot.forEach(doc => {
              const d = doc.data();
              let kolor = "#d1d8e0"; 
              if(d.typ === 'sprawdzian') kolor = "#ff7675";
              if(d.typ === 'kartkówka') kolor = "#ffeaa7";
              if(d.typ === 'zadanie domowe') kolor = "#74b9ff";

              let badge = document.createElement('div');
              badge.style = `background: ${kolor}; font-size: 9px; padding: 2px; border-radius: 2px; border: 1px solid rgba(0,0,0,0.1); cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`;
              badge.title = `KLIKNIJ ABY USUNĄĆ | ${d.typ.toUpperCase()}: ${d.tresc}`;
              badge.textContent = `${d.przedmiot}: ${d.tresc}`;
              
              // DODATEK: Usuwanie po kliknięciu w "pasek"
              badge.onclick = async (e) => {
                  e.stopPropagation();
                  if(confirm(`Czy na pewno usunąć: ${d.tresc}?`)) {
                      await db.collection("klasy").doc(wybranaKlasaDlaOcen).collection("terminarz").doc(doc.id).delete();
                      rysujKalendarz();
                  }
              };
              
              kontener.appendChild(badge);
          });
      });
}

// 5. Nawigacja i Modal
window.zmienMiesiac = function(kierunek) {
    obecnaDataKalendarza.setMonth(obecnaDataKalendarza.getMonth() + kierunek);
    rysujKalendarz();
};

window.otworzModalProjektu = function(data) {
    wybranaDataDlaProjektu = data;
    document.getElementById('modal-data-display').textContent = `Wybrana data: ${data}`;
    
    const selectP = document.getElementById('projekt-przedmiot');
    if(selectP) {
        selectP.innerHTML = "";
        PRZEDMIOTY.forEach(p => {
            let opt = document.createElement('option');
            opt.value = p;
            opt.textContent = p;
            if(p === aktywnyPrzedmiot) opt.selected = true;
            selectP.appendChild(opt);
        });
    }
    document.getElementById('modal-projekt').style.display = 'block';
};

window.zamknijModalProjektu = function() {
    document.getElementById('modal-projekt').style.display = 'none';
    document.getElementById('projekt-tresc').value = "";
};

window.backToMenuFromProjekty = function() {
    document.getElementById('step-8-projekty').style.display = 'none';
    document.getElementById('step-5').style.display = 'block';
};
window.backToMenuFromOceny = function() {
    document.getElementById('step-6-oceny').style.display = 'none';
    document.getElementById('step-5').style.display = 'block';
};
window.backToMenuFromPanelLekcji = function() {
    document.getElementById('step-5').style.display = 'none';
    document.getElementById('step-1').style.display = 'block';
};












// Funkcja powrotu
window.backToMenu = function() {
    sekcjaStep6.style.display = 'none';
    document.getElementById('step-5').style.display = 'block';
};





window.wybierzLekcjeDoOcen = function(przedmiot, nr) {
    // 1. ZAPISUJEMY PRZEDMIOT W PAMIĘCI
    // To jest kluczowe - bez tego otworzPanelOcen nie wie co robić
    window.aktualnyPrzedmiot = przedmiot; 
    window.wybranaKlasa = "7a"; // Ustawiamy na sztywno, skoro na tej klasie pracujesz

    console.log("System zapisał lekcję:", przedmiot, "nr:", nr);

    // 2. AKTUALIZUJEMY TEKST NA EKRANIE LEKCJI (Step 5)
    // Żeby nauczyciel widział, co wybrał
    const infoLekcja = document.getElementById('lesson-subject-name');
    if(infoLekcja) {
        infoLekcja.textContent = przedmiot;
    }

    // 3. PRZECHODZIMY DO PANELU LEKCJI
    document.getElementById('step-4').style.display = 'none';
    if(document.getElementById('step-5')) {
        document.getElementById('step-5').style.display = 'block';
    }
};










// ==========================================
// ODDZIAL SEMESTR I KONIEC - LOGIKA ARKUSZA
// ==========================================

// 1. Uniwersalna funkcja przełączania widoków
window.pokazStep = function(stepId) {
    document.querySelectorAll('[id^="step-"]').forEach(div => {
        div.style.display = 'none';
    });
    const target = document.getElementById(stepId);
    if (target) target.style.display = 'block';
};

// 2. Główna funkcja uruchamiana przyciskiem "🎓 Oceny semestralne i końcowe"
window.otworzArkuszDziennika = function() {
    // Sprawdzenie czy wybrano przedmiot (aktywnyPrzedmiot musi być ustawiony przy wejściu w klasę)
    if (!window.aktywnyPrzedmiot) {
        alert("Najpierw wybierz przedmiot!");
        return;
    }

    const klasa = "7a"; // Możesz zamienić na zmienną dynamiczną jeśli masz więcej klas
    pokazStep('step-7-dziennik');

    // Aktualizacja wizualna nagłówka
    const infoNaglowek = document.getElementById('dziennik-info-podnaglowek');
    if (infoNaglowek) {
        infoNaglowek.textContent = `Przedmiot: ${window.aktywnyPrzedmiot} | Klasa: ${klasa}`;
    }

    // POBIERANIE DANYCH Z FIREBASE
    // Pobieramy: 1. Wszystkie dokumenty z kolekcji ocen, 2. Listę uczniów
    Promise.all([
        db.collection("klasy").doc(klasa).collection("oceny").get(),
        db.collection("klasy").doc(klasa).collection("uczniowie").orderBy("numer").get()
    ]).then(([snapshotOceny, snapshotUczniowie]) => {
        
        const uczniowie = snapshotUczniowie.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const lekcje = [];
        let danePrzew = {}, daneSem = {}, daneKonc = {};

        // Rozdzielamy dane: lekcje idą do tablicy, dokumenty specjalne do obiektów
        snapshotOceny.forEach(doc => {
            if (doc.id === "ocenyprzewidywane") danePrzew = doc.data().oceny || {};
            else if (doc.id === "ocenysemestralne") daneSem = doc.data().oceny || {};
            else if (doc.id === "ocenykoncowe") daneKonc = doc.data().oceny || {};
            else {
                // To jest zwykła lekcja/kolumna ocen cząstkowych
                lekcje.push({ id: doc.id, ...doc.data() });
            }
        });

        // Sortujemy lekcje po dacie (jeśli masz pole 'data'), żeby były chronologicznie
        lekcje.sort((a, b) => (a.data > b.data) ? 1 : -1);

        renderujWielkaTabele(uczniowie, lekcje, danePrzew, daneSem, daneKonc);

    }).catch(err => {
        console.error("Błąd ładowania arkusza:", err);
        alert("Nie udało się pobrać danych z bazy.");
    });
};

// 3. Budowanie tabeli (Renderowanie HTML)
function renderujWielkaTabele(uczniowie, lekcje, przew, sem, konc) {
    const tbody = document.getElementById('lista-uczniow-arkusz-pelny');
    const theadRow = document.querySelector('#tabela-arkusz-pelny thead tr');
    
    // Czyszczenie starych dynamicznych nagłówków lekcji
    theadRow.querySelectorAll('.dynamic-th').forEach(th => th.remove());
    const placeholder = document.getElementById('placeholder-lekcje');

    // Dodawanie nagłówków dla każdej lekcji
    lekcje.forEach(l => {
        let th = document.createElement('th');
        th.className = 'dynamic-th';
        th.style.fontSize = "0.75em";
        th.style.minWidth = "50px";
        th.innerHTML = `${l.id}<br><small style="color: #666;">${l.temat || ''}</small>`;
        placeholder.before(th);
    });

    tbody.innerHTML = '';

    uczniowie.forEach(u => {
        let tr = document.createElement('tr');
        
        // Komórki stałe: Nr i Nazwisko
        let htmlBase = `<td style="text-align:center; padding:8px;">${u.numer}</td>
                        <td style="padding:8px; font-weight:500;">${u.imie} ${u.nazwisko}</td>`;
        tr.innerHTML = htmlBase;

        let suma = 0, licznik = 0;

        // Komórki dynamiczne: Oceny cząstkowe
        lekcje.forEach(l => {
            let td = document.createElement('td');
            let ocena = (l.oceny && l.oceny[u.id]) ? l.oceny[u.id] : '-';
            td.textContent = ocena;
            td.style.textAlign = "center";
            td.style.cursor = "pointer";
            
            // Edycja oceny cząstkowej (używa Twojej istniejącej funkcji)
            td.onclick = () => window.edytujOceneWprost(td, u.id, l.id, ocena);
            
            tr.appendChild(td);

            // Obliczanie do średniej
            let val = parseFloat(ocena.toString().replace(',', '.'));
            if (!isNaN(val)) { suma += val; licznik++; }
        });

        // Komórka: Średnia
        let srednia = (licznik > 0) ? (suma / licznik).toFixed(2) : '-';
        let tdSrednia = document.createElement('td');
        tdSrednia.style.textAlign = "center";
        tdSrednia.style.fontWeight = "bold";
        tdSrednia.style.background = "#fff3e0";
        tdSrednia.textContent = srednia;
        tr.appendChild(tdSrednia);

        // Komórki specjalne: Przewidywana, Semestralna, Końcowa
        tr.appendChild(stworzPoleSpecjalne(u.id, 'ocenyprzewidywane', przew[u.id] || '-', "#e8f5e9"));
        tr.appendChild(stworzPoleSpecjalne(u.id, 'ocenysemestralne', sem[u.id] || '-', "#e1f5fe"));
        tr.appendChild(stworzPoleSpecjalne(u.id, 'ocenykoncowe', konc[u.id] || '-', "#fffde7"));

        tbody.appendChild(tr);
    });
}

// 4. Pomocnik do tworzenia edytowalnych pól klasyfikacji
function stworzPoleSpecjalne(uczenId, docId, wartosc, kolor) {
    let td = document.createElement('td');
    td.textContent = wartosc;
    td.style.textAlign = "center";
    td.style.fontWeight = "bold";
    td.style.background = kolor;
    td.style.cursor = "pointer";
    td.onclick = function() {
        window.edytujSpecjalna(this, uczenId, docId, wartosc);
    };
    return td;
}

// 5. Funkcja edycji i zapisu dla ocen specjalnych (Przew, Sem, Konc)
window.edytujSpecjalna = function(element, uczenId, docId, staraOcena) {
    if (element.querySelector('input')) return;

    const input = document.createElement('input');
    input.type = "text";
    input.value = staraOcena === '-' ? '' : staraOcena;
    input.style.width = "40px";
    input.style.textAlign = "center";
    input.style.fontWeight = "bold";
    
    element.innerHTML = "";
    element.appendChild(input);
    input.focus();

    input.onblur = function() {
        const nowa = input.value.trim();
        if (nowa === staraOcena || (nowa === "" && staraOcena === "-")) {
            element.innerHTML = staraOcena;
            return;
        }

        element.innerHTML = "<small>...</small>";

        const updateData = {};
        updateData[`oceny.${uczenId}`] = nowa;

        // Zapis do dokumentu specjalnego w kolekcji 'oceny'
        db.collection("klasy").doc("7a").collection("oceny").doc(docId)
          .set(updateData, { merge: true })
          .then(() => {
              element.innerHTML = nowa === "" ? "-" : nowa;
              console.log(`Zaktualizowano ${docId} dla ucznia ${uczenId}`);
          })
          .catch(err => {
              console.error("Błąd zapisu specjalnego:", err);
              element.innerHTML = staraOcena;
              alert("Błąd zapisu!");
          });
    };

    input.onkeypress = function(e) {
        if (e.key === 'Enter') input.blur();
    };
};
window.wybierzPrzedmiotIDziennik = function() {
    // Jeśli przedmiot jest już wybrany (np. nauczyciel wszedł z widoku lekcji)
    if (window.aktywnyPrzedmiot) {
        otworzArkuszDziennika();
        return;
    }

    // Jeśli nie ma wybranego przedmiotu, prosimy o wybór (możesz dopisać tu swoje przedmioty)
    const przedmioty = ["Matematyka", "Język polski", "Historia", "Geografia", "Biologia"]; // Twoja lista
    
    let tresc = "Wybierz przedmiot, dla którego chcesz otworzyć arkusz:\n\n";
    przedmioty.forEach((p, index) => tresc += `${index + 1}. ${p}\n`);
    
    const wybor = prompt(tresc);
    
    if (wybor && przedmioty[wybor - 1]) {
        window.aktywnyPrzedmiot = przedmioty[wybor - 1];
        otworzArkuszDziennika();
    } else {
        alert("Musisz wybrać przedmiot, aby zobaczyć oceny!");
    }
};















// ==========================================
// LOGIKA PANELU OCEN (STEP 6) - WERSJA FIX
// ==========================================

// Zmienne pomocnicze

let unsubOceny = null; // Do zatrzymywania nasłuchiwania przy wyjściu


window.otworzPanelOcen = function() {
    // 1. USTALAMY DANE
    // Klasa na sztywno małe '7a' - zgodnie z Twoją bazą
    wybranaKlasaDlaOcen = "7a"; 

    // Pobieramy przedmiot ustawiony podczas wyboru lekcji z planu (Step 4)
    // Nie patrzymy już na pole 'projekt-przedmiot', bo tam zazwyczaj jest pusto
    if (typeof aktualnyPrzedmiot !== 'undefined' && aktualnyPrzedmiot !== "") {
        aktywnyPrzedmiot = aktualnyPrzedmiot.toLowerCase().trim();
    } else {
        // Próba ratunkowa: jeśli zmienna jest pusta, sprawdźmy nagłówek na ekranie lekcji
        const naglowekLekcji = document.getElementById('lesson-subject-name');
        if (naglowekLekcji && naglowekLekcji.textContent) {
            aktywnyPrzedmiot = naglowekLekcji.textContent.toLowerCase().trim();
        } else {
            aktywnyPrzedmiot = "";
        }
    }

    // Blokada, jeśli system nadal nie wie, jaki to przedmiot
    if (!aktywnyPrzedmiot || aktywnyPrzedmiot === "") {
        alert("Błąd: Nie rozpoznano przedmiotu! Wybierz lekcję z planu ponownie.");
        return;
    }

    // 2. CZYSZCZENIE TABELI I NAGŁÓWKA
    const tbody = document.getElementById('lista-uczniow-podglad-ocen');
    const theadRow = document.querySelector('#tabela-wszystkie-oceny thead tr');
    
    if (tbody) tbody.innerHTML = '<tr><td colspan="4">Synchronizacja z bazy danych...</td></tr>';
    if (theadRow) theadRow.innerHTML = '<th>Nr</th><th>Imię i Nazwisko</th>';

    const naglowek = document.getElementById('naglowek-oceny-info');
    if (naglowek) {
        naglowek.textContent = `Przedmiot: ${aktywnyPrzedmiot} | Klasa: ${wybranaKlasaDlaOcen}`;
    }

    // 3. PRZEŁĄCZANIE WIDOKU
    if(document.getElementById('step-5-lekcja')) {
        document.getElementById('step-5-lekcja').style.display = 'none';
    }
    document.getElementById('step-6-oceny').style.display = 'block';

    // 4. USTAWIANIE DATY (dzisiejsza)
    const dataInput = document.getElementById('ocena-data');
    if (dataInput) {
        dataInput.value = new Date().toISOString().split('T')[0];
    }

    // 5. ŚCIĄGANIE DANYCH Z FIREBASE
    console.log(`POBIERANIE OCEN: Klasa [${wybranaKlasaDlaOcen}], Przedmiot [${aktywnyPrzedmiot}]`);
    zaladujWidokPrzedmiotu();
};

/**
 * 2. ŁADOWANIE ARKUSZA ZBIORCZEGO (Real-time Fix)
 */
window.zaladujWidokPrzedmiotu = function() {
    // Jeśli istniało poprzednie nasłuchiwanie, zatrzymaj je (ważne przy zmianie przedmiotu)
    if (unsubOceny) unsubOceny();

    // A. Pobieramy uczniów (raz)
    db.collection("klasy").doc(wybranaKlasaDlaOcen).collection("uczniowie").orderBy("numer").get()
    .then(snapshotUczniowie => {
        let listaUczniow = [];
        snapshotUczniowie.forEach(doc => listaUczniow.push({ id: doc.id, ...doc.data() }));

        // B. Nasłuchiwanie ocen na żywo (OnSnapshot)
        // To sprawi, że dane pojawią się same od razu po wejściu
        unsubOceny = db.collection("klasy").doc(wybranaKlasaDlaOcen).collection("oceny")
        .where("przedmiot", "==", aktywnyPrzedmiot.trim())
        .orderBy("timestamp", "asc")
        .onSnapshot(snapshotKolumny => {
            console.log(`Załadowano/Zmieniono kolumny: ${snapshotKolumny.size}`);
            budujTabeleZbiorcza(listaUczniow, snapshotKolumny);
        }, err => {
            console.error("Błąd bazy (Indeks?):", err);
        });
    });
};

/**
 * 3. BUDOWANIE HTML
 */
function budujTabeleZbiorcza(uczniowie, snapshotKolumny) {
    const theadRow = document.querySelector('#tabela-wszystkie-oceny thead tr');
    const tbody = document.getElementById('lista-uczniow-podglad-ocen');
    
    theadRow.innerHTML = '<th>Nr</th><th>Imię i Nazwisko</th>';
    let daneKolumn = []; // Tutaj będziemy trzymać dane i ID dokumentów

    // 1. BUDOWANIE NAGŁÓWKA
    snapshotKolumny.forEach(doc => {
        daneKolumn.push({ id: doc.id, ...doc.data() });
        let th = document.createElement('th');
        th.style.padding = "5px"; 
        th.style.fontSize = "0.7em";
        th.innerHTML = `${doc.id}<br><small>${doc.data().data}</small>`;
        theadRow.appendChild(th);
    });
    
    theadRow.innerHTML += '<th style="background:#fff3e0;">Śr.</th>';
    tbody.innerHTML = '';

    // 2. BUDOWANIE WIERSZY UCZNIÓW
    uczniowie.forEach(u => {
        let tr = document.createElement('tr');
        
        // Komórki stałe: Numer i Nazwisko
        tr.innerHTML = `
            <td style="text-align:center;">${u.numer}</td>
            <td>${u.imie} ${u.nazwisko}</td>
        `;

        let suma = 0, licznik = 0;

        // Komórki z ocenami (EDYTOWALNE)
        daneKolumn.forEach(kol => {
            let td = document.createElement('td');
            let ocenaValue = (kol.oceny && kol.oceny[u.id]) ? kol.oceny[u.id] : '-';
            
            td.textContent = ocenaValue;
            td.style.textAlignment = "center";
            td.style.cursor = "pointer"; // Zmienia kursor na rączkę
            td.title = "Kliknij, aby edytować";

            // Efekt najechania myszką
            td.onmouseover = function() { this.style.backgroundColor = "#ffffd0"; };
            td.onmouseout = function() { this.style.backgroundColor = ""; };

            // KLUCZ: Funkcja edycji po kliknięciu
            td.onclick = function() {
                edytujOceneWprost(this, u.id, kol.id, ocenaValue);
            };

            tr.appendChild(td);

            // Obliczanie średniej
            let val = parseFloat(ocenaValue.toString().replace(',', '.'));
            if (!isNaN(val)) { suma += val; licznik++; }
        });

        // Komórka średniej
        let srednia = (licznik > 0) ? (suma / licznik).toFixed(2) : '-';
        let tdSrednia = document.createElement('td');
        tdSrednia.style.textAlign = "center";
        tdSrednia.style.fontWeight = "bold";
        tdSrednia.style.background = "#fff9f0";
        tdSrednia.textContent = srednia;
        tr.appendChild(tdSrednia);

        tbody.appendChild(tr);
    });
}

/**
 * 4. OBSŁUGA PRZYCISKÓW (Generowanie i Zapis)
 */
document.getElementById('btn-generuj-tabele').addEventListener('click', () => {
    const temat = document.getElementById('ocena-temat').value;
    if (!temat) return alert("Wpisz temat!");

    document.getElementById('aktualny-temat-wpisywania').textContent = temat;
    document.getElementById('tabela-uczniow-kontener').style.display = 'block';
    
    db.collection("klasy").doc(wybranaKlasaDlaOcen).collection("uczniowie").orderBy("numer").get()
    .then(snapshot => {
        const tbody = document.getElementById('lista-uczniow-oceny');
        tbody.innerHTML = '';
        snapshot.forEach(doc => {
            tbody.innerHTML += `
                <tr>
                    <td style="text-align:center;">${doc.data().numer}</td>
                    <td>${doc.data().imie} ${doc.data().nazwisko}</td>
                    <td><input type="text" class="ocena-input" data-uid="${doc.id}" style="width:40px; text-align:center;"></td>
                    <td><input type="text" class="komentarz-input" style="width:100%;"></td>
                </tr>`;
        });
    });
});

document.getElementById('btn-zapisz-wszystkie-oceny').addEventListener('click', async () => {
    const temat = document.getElementById('ocena-temat').value;
    const dataOceny = document.getElementById('ocena-data').value;
    const ocenyInputs = document.querySelectorAll('.ocena-input');
    const komentarzeInputs = document.querySelectorAll('.komentarz-input');

    let mapaOcen = {}, mapaKomentarzy = {}, licznik = 0;
    ocenyInputs.forEach((input, index) => {
        if (input.value !== "") {
            const uid = input.getAttribute('data-uid');
            mapaOcen[uid] = input.value;
            if (komentarzeInputs[index].value) mapaKomentarzy[uid] = komentarzeInputs[index].value;
            licznik++;
        }
    });

    if (licznik === 0) return alert("Brak ocen!");

    db.collection("klasy").doc(wybranaKlasaDlaOcen).collection("oceny").doc(temat).set({
        data: dataOceny,
        przedmiot: aktywnyPrzedmiot,
        oceny: mapaOcen,
        komentarze: mapaKomentarzy,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert("Zapisano!");
        document.getElementById('ocena-temat').value = "";
        document.getElementById('tabela-uczniow-kontener').style.display = 'none';
    });
});

window.backToMenu = function() {
    if (unsubOceny) unsubOceny(); // Rozłączamy nasłuchiwanie
    if(document.getElementById('step-6-oceny')) document.getElementById('step-6-oceny').style.display = 'none';
    if(document.getElementById('step-5-lekcja')) document.getElementById('step-5-lekcja').style.display = 'block';
};






///logika popraw ocen z tabeli

window.edytujOceneWprost = function(element, uczenId, kolumnaId, staraOcena) {
    if (element.querySelector('input')) return;

    // 1. Tworzymy pole edycji
    const input = document.createElement('input');
    input.type = "text";
    input.value = staraOcena === '-' ? '' : staraOcena;
    input.style.width = "40px";
    input.style.textAlign = "center";
    
    element.innerHTML = "";
    element.appendChild(input);
    input.focus();

    const zapiszZmiane = () => {
        const nowaOcena = input.value.trim();
        
        // Jeśli nie ma zmiany, wracamy do widoku tekstowego
        if (nowaOcena === staraOcena || (nowaOcena === "" && staraOcena === "-")) {
            element.innerHTML = staraOcena;
            return;
        }

        element.innerHTML = "<i>...</i>";

        // 2. KLUCZ: Ścieżka do Twojej bazy
        // Skoro w Firebase masz to pod 'oceny', używamy notacji z kropką: oceny.u1
        const sciezkaAktualizacji = {};
        sciezkaAktualizacji[`oceny.${uczenId}`] = nowaOcena; 

        db.collection("klasy").doc("7a")
          .collection("oceny").doc(kolumnaId)
          .update(sciezkaAktualizacji)
          .then(() => {
              console.log(`✅ Zapisano: ${nowaOcena} dla ${uczenId} w kolumnie ${kolumnaId}`);
              element.innerHTML = nowaOcena === "" ? "-" : nowaOcena;
          })
          .catch(err => {
              console.error("❌ Błąd zapisu:", err);
              element.innerHTML = staraOcena;
              alert("Błąd zapisu! Sprawdź czy dokument " + kolumnaId + " istnieje.");
          });
    };

    // Obsługa wyjścia z pola i klawisza Enter
    input.addEventListener('blur', zapiszZmiane);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') zapiszZmiane();
    });
};








// 1. Otwieranie panelu uwag
document.querySelector('[data-target="uwagi"]').addEventListener('click', () => {
    // Ukrywamy krok 5 (menu), pokazujemy krok 7
    document.getElementById('step-5').style.display = 'none';
    document.getElementById('step-7-uwagi').style.display = 'block';

    // Wypełniamy select kategoriami
    const selectKat = document.getElementById('uwaga-kategoria');
    selectKat.innerHTML = '<option value="">-- wybierz kategorię --</option>';
    KATEGORIE_UWAG.forEach(kat => {
        let opt = document.createElement('option');
        opt.value = kat;
        opt.textContent = kat;
        selectKat.appendChild(opt);
    });

    zaladujUczniowDoUwag();
});

// 2. Ładowanie uczniów z checkboxami
function zaladujUczniowDoUwag() {
    const kontener = document.getElementById('lista-uczniow-uwagi');
    kontener.innerHTML = "Pobieranie uczniów...";

    db.collection("klasy").doc(wybranaKlasaDlaOcen).collection("uczniowie").orderBy("numer").get()
        .then(snapshot => {
            kontener.innerHTML = "";
            snapshot.forEach(doc => {
                const u = doc.data();
                const div = document.createElement('div');
                div.style.padding = "5px 0";
                div.style.borderBottom = "1px solid #eee";
                div.innerHTML = `
                    <label style="cursor:pointer;">
                        <input type="checkbox" class="uwaga-uczen-checkbox" value="${doc.id}"> 
                        ${u.numer}. ${u.imie} ${u.nazwisko}
                    </label>
                `;
                kontener.appendChild(div);
            });
        });
}

// 3. Zapisywanie uwagi
document.getElementById('btn-zapisz-uwage').addEventListener('click', async () => {
    const kategoria = document.getElementById('uwaga-kategoria').value;
    const tresc = document.getElementById('uwaga-tresc').value;
    const zaznaczeniUczniowie = document.querySelectorAll('.uwaga-uczen-checkbox:checked');

    if (!kategoria || !tresc || zaznaczeniUczniowie.length === 0) {
        return alert("Uzupełnij kategorię, treść i zaznacz przynajmniej jednego ucznia!");
    }

    const batch = db.batch();
    const dzis = new Date().toISOString().split('T')[0];

    zaznaczeniUczniowie.forEach(checkbox => {
        const studentId = checkbox.value;
        const nowaUwagaRef = db.collection("klasy")
                               .doc(wybranaKlasaDlaOcen)
                               .collection("uwagi")
                               .doc(); // Unikalne ID dla każdej uwagi

        batch.set(nowaUwagaRef, {
            studentId: studentId,
            kategoria: kategoria,
            tresc: tresc,
            data: dzis,
            nauczyciel: userName.textContent,
            przedmiot: aktywnyPrzedmiot,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    });

    try {
        await batch.commit();
        alert(`Pomyślnie dodano uwagi dla ${zaznaczeniUczniowie.length} osób.`);
        // Czyszczenie
        document.getElementById('uwaga-tresc').value = "";
        backToMenuFromUwagi();
    } catch (err) {
        console.error("Błąd uwag:", err);
        alert("Błąd zapisu: " + err.message);
    }
});

window.backToMenuFromUwagi = function() {
    document.getElementById('step-7-uwagi').style.display = 'none';
    document.getElementById('step-5').style.display = 'block';
};






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

  

    
  });
}

// PRZEJŚCIE DO DZINNIKA
openDziennikBtn.addEventListener('click', ()=>{
  dashboardDiv.style.display='none';
  dziennikDiv.style.display='flex';
});

// POWRÓT DO DASHBOARD Z RESETEM
backToDashboardBtn.addEventListener('click', () => {
  // Najpierw sprzątamy w środku dziennika
  resetDziennikDoPoczatku();
  
  // Potem zmieniamy widok
  dziennikDiv.style.display = 'none';
  dashboardDiv.style.display = 'flex';
});
function resetDziennikDoPoczatku() {
    // 1. Czyścimy zmienne globalne
    wybranaKlasaDlaOcen = "";
    aktywnyPrzedmiot = "";
    aktywnyNumerLekcji = "";

    // 2. Resetujemy listę rozwijaną klas (wybieramy pustą opcję)
    if(listaKlasOceny) listaKlasOceny.value = "";

    // 3. Ukrywamy wszystkie kroki (od 2 do 7)
    const kroki = ['step-2', 'step-3', 'step-4', 'step-5', 'step-6-oceny', 'step-7-uwagi'];
    kroki.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = 'none';
    });

    // 4. Upewniamy się, że Krok 1 (przycisk startowy) jest widoczny, 
    // a Krok 2 (wybór klasy) też, jeśli tak masz w logice otwierania.
    if(sekcjaStep1) sekcjaStep1.style.display = 'block';
    
    // 5. Czyścimy listę lekcji z poprzedniego wyboru
    const listaLekcjiHtml = document.getElementById('lesson-list');
    if(listaLekcjiHtml) listaLekcjiHtml.innerHTML = "";

    console.log("Dziennik został zresetowany do stanu początkowego.");
}


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










// --- FUNKCJE LISTY UCZNIÓW ---

// 1. Otwieranie widoku listy
window.otworzListeUczniow = function() {
    const klasaId = document.getElementById('lista-klas-oddzial').value;
    if (!klasaId) return alert("Błąd: Nie wybrano klasy!");

    document.getElementById('step-10-oddzial-menu').style.display = 'none';
    document.getElementById('step-11-lista-uczniow').style.display = 'block';
    document.getElementById('tytul-listy-klasa').textContent = `Lista uczniów - Klasa ${klasaId}`;
    
    pobierzUczniow(klasaId);
};

// 2. Pobieranie danych z Firebase (Twoja struktura)
function pobierzUczniow(klasaId) {
    const tbody = document.getElementById('tabela-uczniow-body');
    tbody.innerHTML = '<tr><td colspan="3" style="padding:20px; text-align:center;">Ładowanie danych...</td></tr>';

    db.collection("klasy").doc(klasaId).collection("uczniowie").orderBy("numer")
    .get().then((snapshot) => {
        tbody.innerHTML = '';
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="3" style="padding:20px; text-align:center;">Brak uczniów w tej klasie.</td></tr>';
            return;
        }

        snapshot.forEach((doc) => {
            const u = doc.data();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${u.numer || ''}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${u.imie} ${u.nazwisko}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                    <button onclick="usunUcznia('${klasaId}', '${doc.id}')" style="background:none; border:none; color:#e74c3c; cursor:pointer; font-weight:bold;">Usuń</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }).catch(err => {
        console.error("Błąd pobierania:", err);
        tbody.innerHTML = '<tr><td colspan="3" style="color:red;">Błąd ładowania bazy.</td></tr>';
    });
}

// 3. Dodawanie nowego ucznia
window.dodajUczniaDoBazy = function() {
    const klasaId = document.getElementById('lista-klas-oddzial').value;
    const nr = document.getElementById('nowy-uczen-numer').value;
    const imie = document.getElementById('nowy-uczen-imie').value;
    const nazwisko = document.getElementById('nowy-uczen-nazwisko').value;

    if (!imie || !nazwisko || !nr) return alert("Wypełnij wszystkie pola (Nr, Imię, Nazwisko)!");

    db.collection("klasy").doc(klasaId).collection("uczniowie").add({
        imie: imie,
        nazwisko: nazwisko,
        numer: parseInt(nr)
    }).then(() => {
        // Czyścimy formularz
        document.getElementById('nowy-uczen-numer').value = '';
        document.getElementById('nowy-uczen-imie').value = '';
        document.getElementById('nowy-uczen-nazwisko').value = '';
        // Odświeżamy tabelę
        pobierzUczniow(klasaId);
    }).catch(err => alert("Błąd zapisu: " + err));
};

// 4. Usuwanie ucznia
window.usunUcznia = function(klasaId, uczenId) {
    if (confirm("Czy na pewno chcesz usunąć tego ucznia z dziennika?")) {
        db.collection("klasy").doc(klasaId).collection("uczniowie").doc(uczenId).delete()
        .then(() => pobierzUczniow(klasaId))
        .catch(err => alert("Błąd usuwania: " + err));
    }
};

// 5. Powrót
window.backToStep10 = function() {
    document.getElementById('step-11-lista-uczniow').style.display = 'none';
    document.getElementById('step-10-oddzial-menu').style.display = 'block';
};
// ==========================================
// LOGIKA MODUŁU: DZIENNIK ODDZIAŁU
// ==========================================

// Używamy window.onload lub sprawdzamy obecność elementów, aby uniknąć błędu "properties of null"
document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Wejście do Dziennika Oddziału z przycisku głównego
    const btnDzod = document.getElementById('btn-dzod');
    if (btnDzod) {
        btnDzod.addEventListener('click', function() {
            document.getElementById('step-1').style.display = 'none';
            document.getElementById('step-9-oddzial-setup').style.display = 'block';
            zaladujKlasyDoOddzialu();
        });
    }

    // 2. Pokazywanie przycisku "Otwórz" po wybraniu klasy
    const listaKlas = document.getElementById('lista-klas-oddzial');
    if (listaKlas) {
        listaKlas.addEventListener('change', function() {
            const btn = document.getElementById('btn-wejdz-do-menu-oddzialu');
            if (btn) {
                btn.style.display = (this.value !== "") ? 'block' : 'none';
            }
        });
    }

    // 3. Przejście do Menu Głównego (Krok 10)
    const btnWejdz = document.getElementById('btn-wejdz-do-menu-oddzialu');
    if (btnWejdz) {
        btnWejdz.addEventListener('click', function() {
            const wybranaKlasa = document.getElementById('lista-klas-oddzial').value;
            
            // Przełącz widok
            document.getElementById('step-9-oddzial-setup').style.display = 'none';
            document.getElementById('step-10-oddzial-menu').style.display = 'block';
            
            // Ustaw nagłówek
            const naglowek = document.getElementById('naglowek-wybrana-klasa');
            if (naglowek) naglowek.textContent = `Klasa: ${wybranaKlasa}`;
        });
    }
});

// 4. Pobieranie klas z Firebase (funkcja zostaje na zewnątrz)
function zaladujKlasyDoOddzialu() {
    const select = document.getElementById('lista-klas-oddzial');
    if (!select) return;

    db.collection("klasy").get().then((snapshot) => {
        select.innerHTML = '<option value="">-- wybierz klasę --</option>';
        snapshot.forEach((doc) => {
            let opt = document.createElement('option');
            opt.value = doc.id;
            opt.textContent = `Klasa ${doc.id}`;
            select.appendChild(opt);
        });
    }).catch(err => console.error("Błąd ładowania klas:", err));
}

// FUNKCJE POWROTU (zostawiamy jako globalne, bo są wywoływane przez onclick w HTML)
window.backToDashboardFromOddzial = function() {
    document.getElementById('step-9-oddzial-setup').style.display = 'none';
    document.getElementById('step-1').style.display = 'block';
};

window.backToStep9 = function() {
    document.getElementById('step-10-oddzial-menu').style.display = 'none';
    document.getElementById('step-9-oddzial-setup').style.display = 'block';
};



