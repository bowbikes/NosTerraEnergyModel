<select id="customDropdown"></select>
<div id="selectedValue"></div>
<script>
  var optionsArray = [
    {desc: "Baseline : low demand growth : no renewable growth : 90% land tranport electrification", val: "181"}, 
    {desc: "Coal converted to Natural Gas", val: "182"},
    {desc: "Coal converted to NG : growth of Solar and Wind",val: "183"},
    {desc: "Coal converted to NG : Electrify Everything",val: "184"},
    {desc: "Coal converted to NG : Electrify Everything : Cost optimal Solar + Wind",val: "185"},
    {desc: "Coal converted to NG : Electrify Everything : Emissions optimal Solar + Wind + Storage",val: "186"},
    {desc: "Coal converted to NG : Electrify Everything : Cost optimal Solar + Wind + Geothermal",val: "187"},
    {desc: "Increased Demand : Coal Converted to NG : Electrify Everything : Cost optimal Solar + Wind",val: "188"},
    {desc: "Increased Demand : Coal Converted to NG : Electrify Everything : Emissions optimal Solar + Wind + Storage",val: "189"},
    {desc: "Increased Demand : Coal Converted to NG : Electrify Everything : Cost optimal Solar + Wind + Geothermal",val: "190"},
  ];

  function populateDropdown() {
    var select = document.getElementById('customDropdown');
    optionsArray.forEach(function(item) {
      var option = document.createElement('option');
      option.text = item.desc;
      option.value = item.val;
      select.appendChild(option);  // Use appendChild to add options
    });
    // Set default value and trigger updates right after populating the dropdown
    window._scen = "181";
    console.log('intial scenario value', window._scen)
  }
  
  function updateSelectedValue(value) {
    //document.getElementById('selectedValue').textContent = 'Selected Value: ' + value;
    window._scen = value;
    console.log("Selected scenario:", window._scen);
    window.fetchDataAndUpdateChart().then(window.renderSankeyChart).catch(error => {
    console.error("Error fetching data or rendering chart:", error);
    });
  }
  
  document.addEventListener('DOMContentLoaded', populateDropdown);

  document.getElementById('customDropdown').addEventListener('change', function() {
    updateSelectedValue(this.value);
  });
</script>
<style>
  #customDropdown {
    width: 100%;
    margin: 10px 0;
  }
</style>
