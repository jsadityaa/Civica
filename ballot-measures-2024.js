(() => {
  const measuresByState = {
    California: [
      {
        id: "prop-2", label: "Proposition 2", title: "Issue Bonds for Public Education",
        description: "This proposition would authorize $10 billion in bonds to build or repair K-12 schools and community colleges.",
        yes: 59, no: 41
      },
      {
        id: "prop-3", label: "Proposition 3", title: "Constitutional Right to Marriage",
        description: "This proposition would amend the state Constitution to reflect existing laws on Californians’ right to marry regardless of their sex or race.",
        yes: 63, no: 37
      },
      {
        id: "prop-4", label: "Proposition 4", title: "Issue Bonds for Natural Resource Conservation",
        description: "This proposition would authorize a $10 billion bond issue to pay for wildfire prevention, safe drinking water, and protection against the effects of climate change.",
        yes: 60, no: 41
      },
      {
        id: "prop-5", label: "Proposition 5", title: "Lower Approval Requirement for Local Bonds",
        description: "This proposition would change the approval requirement for issuing local infrastructure bonds, lowering it from a ⅔ supermajority to 55%.",
        yes: 45, no: 55
      },
      {
        id: "prop-6", label: "Proposition 6", title: "End Involuntary Labor by the Incarcerated",
        description: "This proposition would amend the state Constitution to remove a previous provision that lets prisons and jails force inmates to work.",
        yes: 47, no: 53
      },
      {
        id: "prop-32", label: "Proposition 32", title: "Raise Minimum Wage",
        description: "This proposition would immediately increase the rate to $17/hr and then to $18/hr on Jan 1, 2025, for workplaces with 26 or more employees. For smaller employers, the rate would increase to $17 on Jan 1, 2025, and then to $18 on Jan 1, 2026.",
        yes: 49.3, no: 50.7
      },
      {
        id: "prop-33", label: "Proposition 33", title: "Expand Local Rent Control",
        description: "This proposition would give local governments more authority to enact rent control by repealing the Costa-Hawkins Rental Housing Act, a state law that limits this power.",
        yes: 40, no: 60
      },
      {
        id: "prop-34", label: "Proposition 34", title: "Regulate Spending by Healthcare Providers",
        description: "This proposition would require that 98% of the revenues from a federal prescription drug discount program be used for direct patient care.",
        yes: 51, no: 49
      },
      {
        id: "prop-35", label: "Proposition 35", title: "Permanently Fund Medi-Cal Health",
        description: "This proposition would create a permanent state tax on health insurance plans, and would use that revenue to fund Medi-Cal services.,",
        yes: 68, no: 32
      },
      {
        id: "prop-36", label: "Proposition 36", title: "Increase Sentences for Drug and Theft Crimes",
        description: "This proposition would allow for felony charges for certain drug and theft crimes if the defendant has two prior convictions.",
        yes: 68, no: 32
      },
      {
        id: "alameda-da-recall", label: "Question", title: "Recall Alameda County District Attorney",
        description: "Voters will decide on whether to oust Pamela Price.",
        yes: 63, no: 37, local: true
      },
      {
        id: "oakland-mayor-recall", label: "Question", title: "Recall Oakland’s Mayor",
        description: "Voters will decide on whether to oust Mayor Sheng Thao.",
        yes: 61, no: 39, local: true
      }
    ]
  };

  const stateName = new URLSearchParams(window.location.search).get("name") || "Alabama";
  const section = document.getElementById("state-election-ballot-measures");
  const jump = document.getElementById("state-election-ballot-measures-jump");
  const measures = measuresByState[stateName] || [];
  if (!section) return;
  section.hidden = !measures.length;
  section.style.display = measures.length ? "" : "none";
  if (jump) jump.hidden = !measures.length;
  if (!measures.length) return;

  function renderMeasure(measure) {
    const winningChoice = measure.yes > measure.no ? "Yes" : "No";
    const percentage = (value) => `${value}%`;
    return `
      <article class="ballot-measure" aria-labelledby="ballot-${measure.id}-title">
        <div class="ballot-measure-heading">
          <span class="ballot-measure-label">${measure.label}</span>
        </div>
        <h3 id="ballot-${measure.id}-title">${measure.title}</h3>
        <p class="ballot-measure-description">${measure.description}</p>
        <div class="ballot-measure-results" role="group" aria-label="${measure.label}: ${winningChoice} wins">
          ${["Yes", "No"].map((choice) => `
            <div class="ballot-measure-choice${choice === winningChoice ? ` is-winner ballot-measure-choice--${choice.toLowerCase()}` : ""}">
              <span>${choice}</span>
              <strong>${percentage(measure[choice.toLowerCase()])}</strong>
            </div>
          `).join("")}
        </div>
      </article>
    `;
  }

  const list = document.getElementById("state-election-ballot-statewide");
  const toggle = document.getElementById("state-election-ballot-toggle");
  let expanded = false;

  function renderList() {
    list.innerHTML = (expanded ? measures : measures.slice(0, 3)).map(renderMeasure).join("");
    toggle.hidden = measures.length <= 3;
    toggle.setAttribute("aria-expanded", String(expanded));
    toggle.textContent = expanded ? "Show fewer ballot measures" : `Show all ${measures.length} ballot measures`;
  }

  toggle.addEventListener("click", () => {
    expanded = !expanded;
    renderList();
  });
  renderList();
})();
