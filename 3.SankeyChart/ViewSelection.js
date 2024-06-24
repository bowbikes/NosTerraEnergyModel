<form id="dataSelection">
  <input type="radio" id="consumption" name="dataOption" value="Consumption" checked>
  <label for="consumption">Consumption</label><br>
  
  <input type="radio" id="emissions" name="dataOption" value="Emissions">
  <label for="emissions">Emissions</label><br>
  
  <input type="radio" id="costOfEnergy" name="dataOption" value="Cost of Energy">
  <label for="costOfEnergy">Cost of Energy</label>
</form>
<script>
// Initialize the default view
window._view = "Consumption";  // Set default view
console.log('intial view is ', window._view);  
// Function to handle data update and chart rendering
function updateDataAndView() {
  console.log("Selected view:", window._view);
  window.fetchDataAndUpdateChart()
    .then(window.renderSankeyChart)
    .catch(error => {
      console.error("Error fetching data or rendering chart:", error);
    });
}

document.getElementById('dataSelection').addEventListener('change', function(event) {
  if (event.target.name === 'dataOption') {
    window._view = event.target.value;
    updateDataAndView(); // Call the function to handle data and view update
  }
});
</script>
