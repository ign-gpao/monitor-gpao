const monitorUrl = document.currentScript.getAttribute('base-url');

//----------------------------- PROJETS ------------------------------

//------ Groupe de fonctions qui permettent d'importer un projet -----

function sendProject(json){
  fetch(`${monitorUrl}/projects/sendProject`, {
    method: "PUT",
    body: json,
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(() => {
    location.reload();
  });
}

//Fonction qui définit si le json est correcte
function isJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        alert('JSON invalide')
        return false;
    }
    return true;
}

// Fonction qui importe un projet via un fichier json
function jsonChanged(file) {
  var reader = new FileReader();
  reader.addEventListener('load', function(e) {
    // contents of file in variable     
    var json = e.target.result;
    if(isJsonString(json)) {
        sendProject(json);
    }
  });
  // read as text file
  reader.readAsText(file);  
}

function createJson(projectName, commandLines, tags) {
  // contents of file in variable     
  const P = { projects:[{name: projectName, jobs:[]}]};
  commandLines.forEach((line, index) => {
    if (line.length>0) {
      let job;
      if (tags === "") {
        job = {name: `job ${index}`, command: line};
      } else {
        job = {name: `job ${index}`, command: line, tags: tags.split(',')};
      }
      P.projects[0].jobs.push(job);
    }
  });
  var json = JSON.stringify(P);
  return json;
}

// Fonction qui importe un projet via un fichier txt
function txtChanged(file, tags) {
  var reader = new FileReader();
  reader.addEventListener('load', function(e) {
    var text = e.target.result.split(/\r\n|\n/);
    var json = createJson(file.name, text, tags);
    if(isJsonString(json)) {
        sendProject(json);
    }
  });
  // read as text file
  reader.readAsText(file);
}

// Fonction qui importe un projet via des lignes de commande à saisir directement dans l'interface
function textareaSubmited(projectName, textarea, tags){
  textarea = textarea.split(/\r\n|\n/);
  var json = createJson(projectName, textarea, tags);
  sendProject(json);
}

//--------------------------------------------------------------------

// Fonction qui récupère la liste des projets filtrées (en json)
function getFilteredProjects(){
  var table = $('#dataTable').DataTable();
  var rowsFiltered = table.rows({
    search: 'applied',     // 'none',    'applied', 'removed'
  }).data();

  var ids = '{"ids":[]}';
  var jsonIds = JSON.parse(ids);

  rowsFiltered.each( function (row) {
    jsonIds["ids"].push(row.project_id);
  });

  return jsonIds
}

function deleteProject(jsonIds) {
  fetch(`${monitorUrl}/projects/deleteProjects`, {
    method: 'DELETE',
    body: JSON.stringify(jsonIds),
    headers: {
      'Content-Type': 'application/json',
    }
  }).then(() => {
    location.reload();
  });
}

// Fonction permettant de supprimer un projet
function deleteOneProject(id, name) {
  var ids = '{"ids":[]}';
  var jsonIds = JSON.parse(ids);
  jsonIds["ids"].push(id);

  if (window.confirm(`Supprimer le projet : ${name} ?`)) {
    deleteProject(jsonIds);
  }
}

// Fonction permettant de supprimer tous les projets filtrés
function deleteFilteredProjects () {
  var jsonIds = getFilteredProjects()
  if (window.confirm(`Supprimer tous les projets filtrés ?`)) {
    deleteProject(jsonIds); 
  }
}

// Fonction permettant de changer la priorité d'un projet
function setPriority(jsonIds, priority) {
  // on fait une requete sur l'API
  fetch(`${monitorUrl}/projects/setPriority?priority=${priority}`, {
    method: 'POST',
    body: JSON.stringify(jsonIds),
    headers: {
      'Content-Type': 'application/json',
    }
  });
}

function setPriorityOneProject(id, priority){
  var ids = '{"ids":[]}';
  var jsonIds = JSON.parse(ids);
  jsonIds["ids"].push(id);
  setPriority(jsonIds, priority)
}

function setPriorityFilteredProjects(priority){
  var jsonIds = getFilteredProjects()
  setPriority(jsonIds, priority)
}

//------------------------------- JOBS -------------------------------

//Fonction qui permet de réinitialiser une liste de jobs (en json)
function reinitJobs(jsonIds){
  fetch(`${monitorUrl}/jobs/reinit`, {
    method: 'POST',
    body: JSON.stringify(jsonIds),
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(() => {
    location.reload();
  });
}

//Fonction qui réinitialise tous les jobs filtrés avec le statut failed
function reinitFilteredJobs(table){
  var rowsFiltered = table.rows({
    search: 'applied',     // 'none',    'applied', 'removed'
  }).data();

  var ids = '{"ids":[]}';
  var jsonIds = JSON.parse(ids);

  rowsFiltered.each( function (row) {
    if ( row.job_status === 'failed' ) {
      jsonIds["ids"].push(row.job_id)
    }
  });
  
  reinitJobs(jsonIds);
}

//Fonction qui permet de réinitialiser une liste de jobs (en json)
function setTags(jsonIds, tags){
  // var ids = '{"ids":[]}';
  // var jsonIds = JSON.parse(ids);
  // jsonIds["ids"].push(id);

  fetch(`${monitorUrl}/jobs/setTags?tags=${tags}`, {
    method: 'POST',
    body: JSON.stringify(jsonIds),
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(() => {
    location.reload();
  });
}


//-------------------------- SESSIONS/HOSTS --------------------------

// Fonction qui récupère la liste des machines filtrées (en json)
function getFilteredHosts(){
  var table = $('#dataTable').DataTable();
  var rowsFiltered = table.rows({
    search: 'applied',     // 'none',    'applied', 'removed'
  }).data();

  var hosts = '{"hosts":[]}';
  var jsonHosts = JSON.parse(hosts);
  
  rowsFiltered.each( function (row) {
    jsonHosts["hosts"].push(row.host);
  });

  return jsonHosts
}

// Fonction modifiant le nombre de threads actifs sur une liste de machine
function setNbActiveSessions(jsonHosts, value) {
  if (!isNaN(value) && value!==null) {
    console.log(monitorUrl);
    fetch(`${monitorUrl}/sessions/setNbActive?value=${value}`, {
      method: 'POST',
      body: JSON.stringify(jsonHosts),
      headers: {
        'Content-Type': 'application/json',
      }
    }).then(() => {
      location.reload();
    });
  }
}

//Fonction qui supprime toutes les sessions inutiles
function deleteUnusedSession(){
  fetch(`${monitorUrl}/sessions/cleanUnused`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(() => {
    location.reload();
  });
}


//------------------------------ AUTRES ------------------------------

// Fonction permettant de vider la base GPAO
function cleanDatabase () {
  if (window.confirm(`Souhaitez vous vider la base ?`)) {
    fetch(`${monitorUrl}/maintenance/cleanDatabase`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    }).then(() => {
      location.reload();
    });
  }
}

// Fonction qui permet de calculer le pourcentage entre une valeur et le total
function percent(num, per) {
  if(per==0)
    return 0;
  return (Math.round((num / per) * 100));
}

// Fonction qui permet de convertir des secondes en jours,h,m,s
function convertSeconds(seconds) {
  nb_jours = Math.floor(seconds / (3600 * 24))
  seconds = seconds % (3600 * 24)
  var result = new Date(seconds * 1000).toISOString()
  h = result.slice(11, 13)
  m = result.slice(14, 16)
  s = result.slice(17, 19)
  if(nb_jours > 0){
    result = nb_jours + 'j' + h + 'h' + m + 'm' + s + 's';
  }else{
    if(h > 0){
      result = h + 'h' + m + 'm' + s + 's';
    }else{
      if(m > 0){
        result = m + 'm' + s + 's';
      }else{
        result = s + 's';
      }
    }
  }
  return result
}

// Fonction qui permet de valider l'input tags
function validateTags(domTags, btnSubmit) {
  const tags = document.getElementById(domTags)
  const btn = document.getElementById(btnSubmit)
  const invalidValue = tags.validity.patternMismatch 
  if (tags.value == "") {
      tags.classList.remove("is-invalid");
      tags.classList.remove("is-valid");
      btn.disabled = false;
  } else {
      if (invalidValue){
          tags.classList.add("is-invalid");
          btn.disabled = true;
      } else {
          tags.classList.remove("is-invalid");
          tags.classList.add("is-valid");
          btn.disabled = false;
      } 
  } 
}
