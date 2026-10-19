(() => {
  const measuresByState = {
    Alabama: [
      {
        id: "state-amendment-1", label: "State Amendment 1", title: "Grant Lands to Franklin County Board of Education",
        description: "This state amendment would give the Franklin County Board of Education the right to sell certain lands in Fayette and Walker Counties that were originally designated for the benefit of schools.",
        yes: 74, no: 26
      }
    ],
    Alaska: [
      {
        id: "measure-1", label: "Measure 1", title: "Raise Minimum Wage",
        description: "This measure would increase the rate to $15 per hour by 2027, and would ensure paid sick leave for workers.",
        yes: 58, no: 42
      },
      {
        id: "measure-2", label: "Measure 2", title: "Repeal Ranked-Choice Voting",
        description: "This measure would eliminate the top-four primary system and ranked-choice voting in general elections.",
        yes: 49.9, no: 50.1
      }
    ],
    Arizona: [
      {
        id: "prop-133", label: "Proposition 133", title: "Require Partisan Primaries",
        description: "This proposition would amend the state Constitution to require direct primary elections for partisan offices.",
        yes: 42, no: 58
      },
      {
        id: "prop-134", label: "Proposition 134", title: "Modify Signature Requirements for Initiatives",
        description: "This proposition would make it harder for citizens to place a statewide measure on the ballot by requiring signatures from 10% of voters in each legislative district rather than a percentage of the state’s total voters.",
        yes: 42, no: 58
      },
      {
        id: "prop-135", label: "Proposition 135", title: "Limit Emergency Powers",
        description: "This proposition would amend the state Constitution to automatically end the governor’s emergency powers 30 days after a state emergency is declared.",
        yes: 44, no: 56
      },
      {
        id: "prop-136", label: "Proposition 136", title: "Allow Constitutional Challenges to Block Initiatives From the Ballot",
        description: "This proposition would allow anyone to sue to block a voter-proposed initiative from the ballot by challenging its constitutionality in a lawsuit filed at least 100 days before the election. Under the current law, constitutional challenges can typically be brought after voters have approved a measure.",
        yes: 38, no: 62
      },
      {
        id: "prop-137", label: "Proposition 137", title: "End Term Limits for Judges",
        description: "This proposition would amend the state Constitution so that voters would no longer have the ability to choose whether to retain a judge. This would apply to the Arizona Supreme Court and Court of Appeals, and judges of the Superior Court in counties with a population greater than 250,000.",
        yes: 22, no: 78
      },
      {
        id: "prop-138", label: "Proposition 138", title: "Allow Employers to Reduce Wages of Tipped Employees",
        description: "This proposition would let employers cut the pay of tipped workers by up to 25 percent below the minimum wage.",
        yes: 25, no: 75
      },
      {
        id: "prop-139", label: "Proposition 139", title: "Right to Abortion",
        description: "This proposition would amend the state Constitution to establish a fundamental right to the procedure, limiting the state’s power to interfere with this right before fetal viability.",
        yes: 62, no: 38
      },
      {
        id: "prop-140", label: "Proposition 140", title: "Eliminate Partisan Primaries",
        description: "This proposition would amend the state Constitution to allow for open primaries, in which any eligible voter could vote for any candidate regardless of party.",
        yes: 41, no: 59
      },
      {
        id: "prop-312", label: "Proposition 312", title: "Allow Tax Refund for Public Nuisance Costs",
        description: "This proposition would let property owners apply for a tax refund for expenses incurred when authorities have repeatedly failed to enforce laws against illegal camping, panhandling and similar issues.",
        yes: 59, no: 41
      },
      {
        id: "prop-313", label: "Proposition 313", title: "Life Imprisonment for Trafficking Minors",
        description: "This proposition would require life behind bars, without possibility of release, for those convicted of a class 2 felony for child sex trafficking.",
        yes: 65, no: 35
      },
      {
        id: "prop-314", label: "Proposition 314", title: "Establish New Crimes Involving Illegal Immigration and Fentanyl",
        description: "This proposition would make it a crime for those in the country illegally to apply for benefits or employment with false information; to enter the state outside lawful ports of entry; and to refuse to comply with orders to leave the U.S. It would also establish a new crime for selling fentanyl that results in a death.",
        yes: 63, no: 37
      },
      {
        id: "prop-315", label: "Proposition 315", title: "Require Legislative Approval for Expensive Regulatory Changes",
        description: "This proposition would require a review of state agency rule changes that are estimated to increase regulatory costs by $100,000 over five years. If the cost estimate exceeds $500,000, the rule would not take effect without legislative action.",
        yes: 47, no: 53
      }
    ],
    Arkansas: [
      {
        id: "issue-1", label: "Issue 1", title: "Expand Lottery-Funded Scholarships",
        description: "This amendment would allow more types of schools to receive state lottery-funded scholarships, making vocational and technical institutes eligible.",
        yes: 90, no: 10, choices: ["For", "Against"]
      },
      {
        id: "issue-2", label: "Issue 2", title: "Require Voter Approval for Casino Licenses",
        description: "This amendment would revoke the Pope County casino gaming license and would require special local elections at a county level to approve such licenses.",
        yes: 56, no: 44, choices: ["For", "Against"]
      }
    ],
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
    ],
    Colorado: [
      {
        id: "amendment-g", label: "Amendment G", title: "Modify Veteran Tax Exemption",
        description: "This amendment would expand the eligibility of the property tax exemption to include disabled veterans who are unable to work, not just veterans with a 100% permanent disability.",
        yes: 73, no: 27
      },
      {
        id: "amendment-h", label: "Amendment H", title: "Create a Judicial Oversight Board",
        description: "This amendment would establish an independent commission responsible for holding disciplinary hearings for judges and justices.",
        yes: 73, no: 27
      },
      {
        id: "amendment-i", label: "Amendment I", title: "End Bail in First-Degree Murder Cases",
        description: "This amendment would create an exception to the right to bail for those facing murder charges.",
        yes: 68, no: 32
      },
      {
        id: "amendment-j", label: "Amendment J", title: "Remove Same-Sex Marriage Ban From Constitution",
        description: "This amendment would remove obsolete language from the state Constitution that only recognized “a union of one man and one woman.”",
        yes: 64, no: 36
      },
      {
        id: "amendment-k", label: "Amendment K", title: "Set Early Deadline for Ballot Initiative Signatures",
        description: "This amendment would make the deadline to submit ballot measure signatures one week earlier.",
        yes: 45, no: 55
      },
      {
        id: "amendment-79", label: "Amendment 79", title: "Right to Abortion",
        description: "This amendment would add language to the state Constitution recognizing the right to the procedure and prohibiting state and local governments from impeding that right. This measure needs 55% of the vote to pass.",
        yes: 62, no: 38
      },
      {
        id: "amendment-80", label: "Amendment 80", title: "School Choice in K-12 Education",
        description: "This amendment would establish the right to school choice for students from kindergarten to 12th grade, which would include charter and private schools and home schooling.",
        yes: 49.3, no: 50.7
      },
      {
        id: "prop-jj", label: "Proposition JJ", title: "Retain Excess Sports Betting Tax Revenue",
        description: "This proposition would let the state keep sports betting proceeds beyond the previously approved limit of $29 million instead of refunding that money to casinos.",
        yes: 76, no: 24
      },
      {
        id: "prop-kk", label: "Proposition KK", title: "Impose Excise Tax on Firearms",
        description: "This proposition would authorize a tax on gun and ammunition dealers in order to fund mental health services for veterans and at-risk youth.",
        yes: 54, no: 46
      },
      {
        id: "prop-127", label: "Proposition 127", title: "Prohibit Big-Cat Trophy Hunting",
        description: "This proposition would make it a crime to hunt mountain lions, lynx, and bobcats.",
        yes: 45, no: 55
      },
      {
        id: "prop-128", label: "Proposition 128", title: "Delay Parole Eligibility for Violent Offenders",
        description: "This proposition would require an offender convicted of certain violent crimes, including second-degree murder, first-degree assault, class 2 felony kidnapping or sexual assault, to serve at least 85% of their sentence before becoming eligible for parole. (The current requirement is 75%.)",
        yes: 62, no: 38
      },
      {
        id: "prop-129", label: "Proposition 129", title: "Regulate the Veterinary Profession",
        description: "This proposition would establish a veterinary professional associate profession, setting qualifications and making it a crime to practice veterinary medicine without being registered with a state board.",
        yes: 53, no: 47
      },
      {
        id: "prop-130", label: "Proposition 130", title: "Expand Funding for Law Enforcement",
        description: "This proposition would direct the legislature to appropriate $350 million for an officer training and support fund and increase annual pay for police officials.",
        yes: 53, no: 47
      },
      {
        id: "prop-131", label: "Proposition 131", title: "Create New Election Processes",
        description: "This proposition would allow top-four primary elections and ranked choice voting in general elections for House, Senate, governor, and other races.",
        yes: 46, no: 54
      }
    ],
  "Connecticut": [
    {
      "id": "amendment-1",
      "label": "Amendment 1",
      "title": "Expand Absentee Voting",
      "description": "This amendment would support a law allowing any voter to vote by absentee ballot, without needing an excuse.",
      "yes": 58,
      "no": 42
    }
  ],
  "Florida": [
    {
      "id": "amendment-1",
      "label": "Amendment 1",
      "title": "Require Partisan School Board Elections",
      "description": "This amendment would require that district school board members be chosen in a partisan election, instead of a nonpartisan one.",
      "yes": 55,
      "no": 45
    },
    {
      "id": "amendment-2",
      "label": "Amendment 2",
      "title": "Right to Fish and Hunt",
      "description": "This amendment would make fishing, hunting, and the taking of wildlife by traditional methods a public right.",
      "yes": 67,
      "no": 33
    },
    {
      "id": "amendment-3",
      "label": "Amendment 3",
      "title": "Legalize Marijuana",
      "description": "This amendment would allow adults aged 21 and over to buy, possess, and use marijuana.",
      "yes": 56,
      "no": 44
    },
    {
      "id": "amendment-4",
      "label": "Amendment 4",
      "title": "Right to Abortion",
      "description": "This amendment limits government interference with the procedure before viability or when needed for the patientʼs health. This measure needs 60% of the vote to pass.",
      "yes": 57,
      "no": 43
    },
    {
      "id": "amendment-5",
      "label": "Amendment 5",
      "title": "Adjust Property Valuations for Inflation",
      "description": "This amendment would give homeowners a tax break by adjusting the homestead property tax exemption for inflation on an annual basis.",
      "yes": 66,
      "no": 34
    },
    {
      "id": "amendment-6",
      "label": "Amendment 6",
      "title": "Repeal Public Financing for Statewide Campaigns",
      "description": "This amendment would eliminate the constitutional requirement for public financing of campaigns in state races.",
      "yes": 50.4,
      "no": 49.6
    }
  ],
  "Georgia": [
    {
      "id": "constitutional-amendment-1",
      "label": "Constitutional Amendment 1",
      "title": "Provide Local Homestead Tax Exemption",
      "description": "This amendment would limit increases in the assessed value of homesteads, but would let local governments opt out.",
      "yes": 63,
      "no": 37
    },
    {
      "id": "constitutional-amendment-2",
      "label": "Constitutional Amendment 2",
      "title": "Create Tax Court",
      "description": "This amendment would establish a new, independent tax court with statewide jurisdiction.",
      "yes": 52,
      "no": 48
    },
    {
      "id": "statewide-referendum-question-a",
      "label": "Statewide Referendum Question A",
      "title": "Increase Property Tax Exemption",
      "description": "This proposition would raise the personal property tax exemptions to $20,000. The current amount is $7,500.",
      "yes": 64,
      "no": 36
    }
  ],
  "Hawaii": [
    {
      "id": "constitutional-amendment-1",
      "label": "Constitutional Amendment 1",
      "title": "Right to Marry",
      "description": "This amendment would change the state Constitution to repeal the legislatureʼs power to limit marriage to heterosexual couples.",
      "yes": 56,
      "no": 37
    },
    {
      "id": "constitutional-amendment-2",
      "label": "Constitutional Amendment 2",
      "title": "Standardize Judicial Appointment Process",
      "description": "This amendment would set a uniform appointment and confirmation process for district court judges, supreme court justices, and intermediate court of apples and circuit court judges.",
      "yes": 71,
      "no": 29
    }
  ],
  "Idaho": [
    {
      "id": "amendment-hjr005",
      "label": "Amendment HJR005",
      "title": "Require Citizenship to Vote",
      "description": "This amendment would prohibit noncitizens from voting in any election held in Idaho.",
      "yes": 65,
      "no": 35
    },
    {
      "id": "proposition-1",
      "label": "Proposition 1",
      "title": "Open Primaries Act",
      "description": "This proposition would allow top-four primary elections and ranked-choice voting in general elections for House, Senate, governor, state and county races.",
      "yes": 30,
      "no": 70
    }
  ],
  "Illinois": [
    {
      "id": "advisory-question",
      "label": "Advisory Question",
      "title": "Election Worker Protection",
      "description": "This nonbinding measure expresses support for penalizing any candidate who interferes, or attempts to interfere, with the official responsibilities of an election worker.",
      "yes": 89,
      "no": 11
    },
    {
      "id": "advisory-question-2",
      "label": "Advisory Question",
      "title": "Create New Tax Bracket",
      "description": "This nonbinding measure expresses support for establishing an extra 3% tax on income of over $1 million, with that revenue being directed to property tax relief.",
      "yes": 61,
      "no": 39
    },
    {
      "id": "advisory-question-3",
      "label": "Advisory Question",
      "title": "Support Reproductive Health Coverage",
      "description": "This nonbinding measure expresses support for the idea that in vitro fertilization (IVF) and similar treatments should be covered by health insurance plans that cover pregnancy benefits.",
      "yes": 73,
      "no": 27
    }
  ],
  "Indiana": [
    {
      "id": "question-1",
      "label": "Question 1",
      "title": "Remove Superintendent from Gubernatorial Succession",
      "description": "This amendment would remove the state superintendent of public instruction from the line of succession to serve as governor.",
      "yes": 54,
      "no": 46
    }
  ],
  "Iowa": [
    {
      "id": "amendment-1",
      "label": "Amendment 1",
      "title": "Require Citizenship to Vote and Modify Voting Age",
      "description": "This amendment would change the Constitution to say that “only a citizen” can vote, instead of saying “every citizen” can vote. It would also allow 17-year-olds to vote in primary elections if they will be 18 by the general election.",
      "yes": 77,
      "no": 23
    },
    {
      "id": "amendment-2",
      "label": "Amendment 2",
      "title": "Modify Gubernatorial Succession",
      "description": "This amendment would codify that, if Iowaʼs governor dies, resigns, or is permanently incapacitated, the lieutenant governor would take over the office and would have authority to appoint a new lieutenant governor.",
      "yes": 81,
      "no": 19
    }
  ],
  "Kentucky": [
    {
      "id": "amendment-1",
      "label": "Amendment 1",
      "title": "Require Citizenship to Vote and Modify Voting Age",
      "description": "This amendment would prohibit noncitizens from voting in any election held in Kentucky.",
      "yes": 62,
      "no": 38
    },
    {
      "id": "amendment-2",
      "label": "Amendment 2",
      "title": "Allow State Funding for Non-Public Education",
      "description": "This amendment would allow the state legislature to give financial support to students in private or charter schools.",
      "yes": 35,
      "no": 65
    }
  ],
  "Louisiana": [
    {
      "id": "amendment-1",
      "label": "Amendment 1",
      "title": "Increase Coastal Protection and Restoration Fund",
      "description": "This amendment would require that federal money Louisiana receives from oil, gas, and renewable energy production on the Outer Continental Shelf be directed into a coastal protection fund.",
      "yes": 73,
      "no": 27
    }
  ],
  "Maine": [
    {
      "id": "question-1",
      "label": "Question 1",
      "title": "Limit Contributions to Super PACs",
      "description": "This proposition would set a $5,000 limit for donations to the political action committees.",
      "yes": 75,
      "no": 25
    },
    {
      "id": "question-2",
      "label": "Question 2",
      "title": "Issue Research, Development and Commercialization Bond",
      "description": "This measure would authorize a $25 million bond issue to support innovation in technologies for life sciences, biomedicine, renewable energy and other sectors.",
      "yes": 54,
      "no": 46
    },
    {
      "id": "question-3",
      "label": "Question 3",
      "title": "Issue Historic Community Restoration Bond",
      "description": "This measure would authorize a $10 million bond issue to restore historic buildings owned by the government or nonprofits, with financing requiring a 25% local match.",
      "yes": 51,
      "no": 49
    },
    {
      "id": "question-4",
      "label": "Question 4",
      "title": "Issue Outdoor Recreation Bonds",
      "description": "This measure would authorize a $30 million bond issue to develop and maintain trails statewide.",
      "yes": 55,
      "no": 45
    },
    {
      "id": "question-5",
      "label": "Question 5",
      "title": "Restore Former State Flag",
      "description": "This proposition would bring back the Pine Tree Flag as the stateʼs official standard.",
      "yes": 44,
      "no": 56
    }
  ],
  "Maryland": [
    {
      "id": "question-1",
      "label": "Question 1",
      "title": "Right to Reproductive Freedom",
      "description": "This amendment would guarantee the right to abortion access by adding language to the Constitution protecting “the ability to make and effectuate decisions to prevent, continue, or end oneʼs own pregnancy.”",
      "yes": 76,
      "no": 24
    }
  ],
  "Massachusetts": [
    {
      "id": "question-1",
      "label": "Question 1",
      "title": "Authorize the State Auditor to Audit the Legislature",
      "description": "This proposal would give new powers to the State Auditor, letting the office inspect the accounts, programs, and activities of the state legislative body without needing consent.",
      "yes": 72,
      "no": 28
    },
    {
      "id": "question-2",
      "label": "Question 2",
      "title": "Remove MCAS Tests as High School Graduation Requirement",
      "description": "This proposal would eliminate the rule that high schools need to pass the Massachusetts Comprehensive Assessment System exams in order to receive a diploma.",
      "yes": 59,
      "no": 41
    },
    {
      "id": "question-3",
      "label": "Question 3",
      "title": "Allow Transportation Network Drivers to Unionize",
      "description": "This proposal would allow ride-share drivers, like those who work for Uber or Lyft, to join a labor union.",
      "yes": 54,
      "no": 46
    },
    {
      "id": "question-4",
      "label": "Question 4",
      "title": "Legalize Psychedelic Substances",
      "description": "This proposal would allow people 21 and over to grow, use, and possess the following substances: psilocybin, psilocin, dimethyltryptamine, mescaline, and ibogaine. These psychedelic drugs would only be available for purchase at approved locations and for use while a licensed facilitator supervises.",
      "yes": 43,
      "no": 57
    },
    {
      "id": "question-5",
      "label": "Question 5",
      "title": "Increase Minimum Wage of Tipped Employees",
      "description": "This proposal would gradually raise the tipped minimum wage over a five-year period, starting with an increase to 64% of the state minimum wage on Jan. 1 2025 and ending with a match to 100% on Jan. 1, 2029.",
      "yes": 36,
      "no": 64
    }
  ],
  "Missouri": [
    {
      "id": "amendment-2",
      "label": "Amendment 2",
      "title": "Legalize Sports Betting",
      "description": "This amendment would permit licensed sports wagering, including online betting, for individuals aged 21 and over.",
      "yes": 50.1,
      "no": 49.9
    },
    {
      "id": "amendment-3",
      "label": "Amendment 3",
      "title": "Right to Abortion",
      "description": "This amendment would establish a constitutional right to reproductive rights and would remove Missouriʼs ban on abortion.",
      "yes": 52,
      "no": 48
    },
    {
      "id": "amendment-5",
      "label": "Amendment 5",
      "title": "Allow Osage River Casino",
      "description": "This amendment would authorize the Missouri Gaming Commission to grant an additional gambling boat license for a boat on the Osage River.",
      "yes": 48,
      "no": 52
    },
    {
      "id": "amendment-6",
      "label": "Amendment 6",
      "title": "Increase Police Funding",
      "description": "This amendment would allow courts to charge fees that would fund the salaries of law enforcement personnel.",
      "yes": 39,
      "no": 61
    },
    {
      "id": "amendment-7",
      "label": "Amendment 7",
      "title": "Require Citizenship to Vote and Prohibit Ranked-Choice Voting",
      "description": "This amendment would change the state Constitution to say that only U.S. citizens can vote. It would also prohibit the ranking of candidates by voters.",
      "yes": 68,
      "no": 32
    },
    {
      "id": "proposition-a",
      "label": "Proposition A",
      "title": "Raise Minimum Wage",
      "description": "This proposition would increase the stateʼs minimum wage to $13.75 per hour starting in 2025, and would raise it again to $15 per hour starting in 2026.",
      "yes": 68,
      "no": 32
    }
  ],
  "Montana": [
    {
      "id": "ci-126",
      "label": "CI-126",
      "title": "Support a Top-Four Primary",
      "description": "This amendment would create a top-four primary election system for House, Senate, governor and state races.",
      "yes": 49,
      "no": 51
    },
    {
      "id": "ci-127",
      "label": "CI-127",
      "title": "Require Majority Vote to Win Election",
      "description": "This amendment would change the state Constitution to say that certain offices can only be won by receiving a majority vote, and not by a plurality. This would apply to House, Senate, governor and other state races.",
      "yes": 40,
      "no": 60
    },
    {
      "id": "ci-128",
      "label": "CI-128",
      "title": "Right to Abortion",
      "description": "This amendment would change the state Constitution to establish a right for individuals to have access to the procedure. It would also prohibit the government from punishing doctors or those who receive abortions.",
      "yes": 58,
      "no": 42
    }
  ],
  "Nebraska": [
    {
      "id": "initiative-434",
      "label": "Initiative 434",
      "title": "Prohibit Abortion Past First Trimester",
      "description": "This measure would amend the state Constitution to not allow the procedure in the second or third trimester, except in cases of medical emergency or for pregnancies resulting from incest or sexual assault.",
      "yes": 55,
      "no": 45
    },
    {
      "id": "initiative-436",
      "label": "Initiative 436",
      "title": "Require Paid Sick Leave",
      "description": "This measure would give eligible employees at small companies the ability to accrue and use 40 hours of paid sick time per year. Workers at larger companies would get 56 hours per year.",
      "yes": 75,
      "no": 25
    },
    {
      "id": "initiative-437",
      "label": "Initiative 437",
      "title": "Legalize Medical Marijuana",
      "description": "This measure would allow for the use and possession of up to five ounces of cannabis by patients and their caregivers for medical purposes.",
      "yes": 71,
      "no": 25
    },
    {
      "id": "initiative-438",
      "label": "Initiative 438",
      "title": "Establish a Medical Cannabis Commission",
      "description": "This measure would create a government board to regulate medical cannabis for patients in Nebraska.",
      "yes": 67,
      "no": 33
    },
    {
      "id": "initiative-439",
      "label": "Initiative 439",
      "title": "Right to Abortion",
      "description": "This measure would amend the state Constitution to establish a right to the procedure until fetal viability, or when necessary to safeguard the health of the pregnant patient.",
      "yes": 49,
      "no": 51
    },
    {
      "id": "referendum-435",
      "label": "Referendum 435",
      "title": "Referendum on Private Education Scholarships",
      "description": "This referendum will decide whether to retain or repeal Section 1 of Legislative Bill 1402, which provides for $10 million a year to fund education scholarships for qualifying students at private elementary and secondary schools. A “repeal” vote would eliminate the funding.",
      "yes": 57,
      "no": 43,
      "choices": [
        "Repeal",
        "Retain"
      ]
    }
  ],
  "Nevada": [
    {
      "id": "question-1",
      "label": "Question 1",
      "title": "Reform Higher Education Governance",
      "description": "This would amend the state Constitution to strip the Board of Regents of its constitutional status, and would give state legislators the power to manage state universities.",
      "yes": 45,
      "no": 55
    },
    {
      "id": "question-2",
      "label": "Question 2",
      "title": "Revise Constitutional Language",
      "description": "This would amend the state Constitution to update the terminology about people who benefit from the stateʼs support, such as changing the term “insane” to “persons with significant mental illness.”",
      "yes": 66,
      "no": 34
    },
    {
      "id": "question-3",
      "label": "Question 3",
      "title": "Establish Top-5 Primaries and Ranked-Choice Voting",
      "description": "This amendment would allow for open primaries in which the top 5 candidates would advance, and would let voters rank their choice of candidates in the general election.",
      "yes": 47,
      "no": 53
    },
    {
      "id": "question-4",
      "label": "Question 4",
      "title": "Remove Slavery Exception",
      "description": "This amendment would ban the use of involuntary servitude as a punishment for a crime.",
      "yes": 61,
      "no": 39
    },
    {
      "id": "question-5",
      "label": "Question 5",
      "title": "Exempt Diapers from Sales Tax",
      "description": "This amendment would exempt child and adult diapers from taxes imposed by the Sales and Use Tax Act of 1955 and other sales taxes.",
      "yes": 68,
      "no": 32
    },
    {
      "id": "question-6",
      "label": "Question 6",
      "title": "Right to Abortion",
      "description": "This would amend the state Constitution to establish a fundamental right to the procedure and fetal viability or when needed to safeguard the health of the pregnant person. (If passed, this proposition will not automatically become law but will be placed on a general election ballot in 2026.)",
      "yes": 64,
      "no": 36
    },
    {
      "id": "question-7",
      "label": "Question 7",
      "title": "Require Photo ID to Vote",
      "description": "This would amend the state Constitution to require that voters verify their identity with a photo identification. (If passed, this proposition will not automatically become law but will be placed on a general election ballot in 2026.)",
      "yes": 64,
      "no": 36
    }
  ],
  "New Hampshire": [
    {
      "id": "question-1",
      "label": "Question 1",
      "title": "Raise the Retirement Age for Judges",
      "description": "This measure would raise the mandatory judicial retirement age in New Hampshire from 70 to 75.",
      "yes": 66,
      "no": 34
    }
  ],
  "New Mexico": [
    {
      "id": "bond-question-1",
      "label": "Bond Question 1",
      "title": "Issue Senior Citizen Bonds",
      "description": "This would authorize a $30.7 million bond issue to pay for improvements in senior citizensʼ facilities.",
      "yes": 70,
      "no": 30
    },
    {
      "id": "bond-question-2",
      "label": "Bond Question 2",
      "title": "Issue Public Library Bonds",
      "description": "This would authorize a $19.3 million bond issue to fund public libraries.",
      "yes": 67,
      "no": 33
    },
    {
      "id": "bond-question-3",
      "label": "Bond Question 3",
      "title": "Issue Public Education Bonds",
      "description": "This would authorize a $230 million bond issue to fund capital expenditures for higher education institutions, special schools and tribal schools in the state.",
      "yes": 66,
      "no": 34
    },
    {
      "id": "bond-question-4",
      "label": "Bond Question 4",
      "title": "Issue Public Safety Bonds",
      "description": "This would authorize a $10.3 million bond issue for upgrades to public safety radio communication systems.",
      "yes": 63,
      "no": 37
    },
    {
      "id": "amendment-1",
      "label": "Amendment 1",
      "title": "Disabled Veteran Tax Exemption",
      "description": "This amendment would establish a scale for property tax exemptions for disabled veterans, matching the percentage of their federal disability rating.",
      "yes": 83,
      "no": 17
    },
    {
      "id": "amendment-2",
      "label": "Amendment 2",
      "title": "Raise Veteran Property Tax Exemption",
      "description": "This amendment would increase the annual benefit from $4,000 to $10,000, and would adjust it for inflation in the future.",
      "yes": 72,
      "no": 28
    },
    {
      "id": "amendment-3",
      "label": "Amendment 3",
      "title": "Judicial Nominating Commission",
      "description": "This amendment would allow the dean of the University of New Mexicoʼs law school to appoint a designee to the commission.",
      "yes": 51,
      "no": 49
    },
    {
      "id": "amendment-4",
      "label": "Amendment 4",
      "title": "County Officer Compensation",
      "description": "This amendment would give a board of county commissioners the power to set the salaries of county officials, taking that responsibility away from the state legislature.",
      "yes": 66,
      "no": 34
    }
  ],
  "New York": [
    {
      "id": "proposition-1",
      "label": "Proposition 1",
      "title": "Equal Protection of Law",
      "description": "This amendment would add language to the state Constitution providing that individuals cannot be denied rights on the basis of their “ethnicity, national origin, age, disability” or “sex, including sexual orientation, gender identity, gender expression, pregnancy, pregnancy outcomes, and reproductive healthcare and autonomy.“",
      "yes": 62,
      "no": 38
    },
    {
      "id": "new-york-city-proposition-2",
      "label": "New York City Proposition 2",
      "title": "Cleaning of Public Property",
      "description": "This measure would give the Department of Sanitation greater authority to clean streets, parks, and other city property, and to enforce rules against street vendors. It would also let the department set rules for garbage collection.",
      "yes": 62,
      "no": 38
    },
    {
      "id": "new-york-city-proposition-3",
      "label": "New York City Proposition 3",
      "title": "Require Fiscal Analysis for City Council",
      "description": "This measure would require the City Council to publish cost estimates of proposed laws before public hearings are held. It would also slightly extend city budget deadlines.",
      "yes": 56,
      "no": 44
    },
    {
      "id": "new-york-city-proposition-4",
      "label": "New York City Proposition 4",
      "title": "Public Notice Before Safety Legislation",
      "description": "This measure would require a 30-day public notice before the City Council votes on legislation that involves the police, fire or correction departments.",
      "yes": 57,
      "no": 43
    },
    {
      "id": "new-york-city-proposition-5",
      "label": "New York City Proposition 5",
      "title": "Capital Planning",
      "description": "This measure would require more detail in some annual reports on the state of the cityʼs infrastructure, including information on maintenance costs and needs.",
      "yes": 58,
      "no": 42
    },
    {
      "id": "new-york-city-proposition-6",
      "label": "New York City Proposition 6",
      "title": "Establish Chief Business Diversity Officer; Film Permits; and Archive Review Boards",
      "description": "This measure would make several changes in the City Charter. It would create a new position tasked with supporting minority and women-owned business enterprises. It would give the mayorʼs office the authority to issue film permits. And it would allow two boards that oversee the city archives to merge together.",
      "yes": 48,
      "no": 52
    }
  ],
  "North Carolina": [
    {
      "id": "amendment-1",
      "label": "Amendment 1",
      "title": "Require Citizenship to Vote",
      "description": "This amendment would change the state Constitution to say that only U.S. citizens can vote.",
      "yes": 78,
      "no": 22
    }
  ],
  "North Dakota": [
    {
      "id": "measure-1",
      "label": "Measure 1",
      "title": "Update Language in Constitution",
      "description": "This measure would amend the state Constitution to replace some outdated terminology, including changing a line about education for “the deaf and dumb” to instead say “deaf and hard of hearing.”",
      "yes": 84,
      "no": 16
    },
    {
      "id": "measure-2",
      "label": "Measure 2",
      "title": "Tighten Requirements for Ballot Initiatives",
      "description": "This measure would increase the number of signatures needed to put a constitutional initiative on the ballot, from 4% to 5% of state residents. It would also require petition signers to give a complete address and require sponsors to be qualified electors. Future measures would have to be approved by voters twice, first in a primary and again in a general election, in order to pass.",
      "yes": 44,
      "no": 56
    },
    {
      "id": "measure-3",
      "label": "Measure 3",
      "title": "Reduce Legacy Fund Limit",
      "description": "This measure would limit the money that can be spent from the stateʼs legacy fund, which receives revenue from oil and gas production. The state would only be able to spend 5% of the principal every 2 years, instead of 15%.",
      "yes": 52,
      "no": 48
    },
    {
      "id": "measure-4",
      "label": "Measure 4",
      "title": "Prohibit Property Tax",
      "description": "This measure would bar state and local governments from levying taxes based on the value of a home or property.",
      "yes": 37,
      "no": 63
    },
    {
      "id": "measure-5",
      "label": "Measure 5",
      "title": "Legalize Marijuana",
      "description": "This measure would allow for the production, sale, possession and use of cannabis by those 21 years of age and over.",
      "yes": 47,
      "no": 53
    }
  ],
  "Ohio": [
    {
      "id": "measure-1",
      "label": "Measure 1",
      "title": "Update Language in Constitution",
      "description": "This amendment would set up a body composed of 15 non-politician members who would be tasked with creating fair congressional and legislative districts.",
      "yes": 46,
      "no": 54
    }
  ],
  "Oklahoma": [
    {
      "id": "question-833",
      "label": "Question 833",
      "title": "Create Public Infrastructure Districts",
      "description": "This amendment would allow the formation of public infrastructure districts, which would have the power to issue bonds (of up to $10 million) to fund public improvements. These districts would be created when 100 percent of the property owners within the proposed boundaries sign a petition and file it with their municipality.",
      "yes": 38,
      "no": 62
    },
    {
      "id": "question-834",
      "label": "Question 834",
      "title": "Require Citizenship to Vote",
      "description": "This amendment would change the Constitution to say that “only citizens” can vote, instead of saying “all citizens” can vote.",
      "yes": 81,
      "no": 19
    }
  ],
  "Oregon": [
    {
      "id": "measure-115",
      "label": "Measure 115",
      "title": "Authorize Legislature to Impeach State Elected Officials",
      "description": "This measure would amend the state Constitution to give Oregonʼs legislature the authority to impeach and remove the governor, attorney general, secretary of state and other statewide elected officials.",
      "yes": 64,
      "no": 36
    },
    {
      "id": "measure-116",
      "label": "Measure 116",
      "title": "Create Public Service Compensation Commission",
      "description": "This measure would amend the state Constitution to establish an independent commission to determine the salaries of specified state officials.",
      "yes": 48,
      "no": 52
    },
    {
      "id": "measure-117",
      "label": "Measure 117",
      "title": "Establish Ranked-Choice Voting Statewide",
      "description": "This measure would enable voters to rank their preferences for candidates in federal and state elections starting in 2028.",
      "yes": 42,
      "no": 58
    },
    {
      "id": "measure-118",
      "label": "Measure 118",
      "title": "Increase Corporate Tax and Issue Rebates to Residents",
      "description": "This measure would establish a rebate system in which residents who live in their state at least 200 days a year would collect money generated by taxing corporations a minimum of 3% of their sales over $25 million.",
      "yes": 23,
      "no": 77
    },
    {
      "id": "measure-119",
      "label": "Measure 119",
      "title": "Ensure Cannabis Workers Right to Collective Bargaining",
      "description": "This measure would require cannabis businesses to remain neutral on labor issues and allow their employees to organize.",
      "yes": 57,
      "no": 43
    }
  ],
  "South Carolina": [
    {
      "id": "amendment-1",
      "label": "Amendment 1",
      "title": "Require Citizenship to Vote",
      "description": "This amendment would change the Constitution to say that “only a citizen” can vote, instead of saying “every citizen” can vote.",
      "yes": 86,
      "no": 14
    }
  ],
  "South Dakota": [
    {
      "id": "amendment-e",
      "label": "Amendment E",
      "title": "Adopt Gender-Neutral Language in the Constitution",
      "description": "This amendment would change the state Constitution to remove the default use of the male pronouns he, his and him to refer to certain officeholders.",
      "yes": 43,
      "no": 57
    },
    {
      "id": "amendment-f",
      "label": "Amendment F",
      "title": "Impose Work Requirements for Medicaid",
      "description": "This amendment would let the state set work requirements for any individual who qualifies for expanded Medicaid benefits.",
      "yes": 56,
      "no": 44
    },
    {
      "id": "amendment-g",
      "label": "Amendment G",
      "title": "Right to Abortion",
      "description": "This amendment would establish a constitutional right to the procedure. In the first trimester, there would be no restrictions. In the second trimester, regulations of abortion decisions would be allowed. In the third trimester, abortion would be regulated or prohibited except when medically necessary to save the life of the pregnant person.",
      "yes": 41,
      "no": 59
    },
    {
      "id": "amendment-h",
      "label": "Amendment H",
      "title": "Establish Top-2 Primary Elections",
      "description": "This amendment would enable voters to rank their preference for candidates in an open primary, with the top two vote-getters advancing. THis would apply to House, Senate, governor, state, and county races.",
      "yes": 43,
      "no": 57
    },
    {
      "id": "measure-28",
      "label": "Measure 28",
      "title": "Prohibit Taxes on Food and Grocery",
      "description": "This measure would get rid of taxes on any product sold for human consumption, with the exceptions of alcoholic beverages and prepared food.",
      "yes": 31,
      "no": 69
    },
    {
      "id": "measure-29",
      "label": "Measure 29",
      "title": "Legalize Marijuana",
      "description": "This measure would allow for the use, distribution, and possession of up to two ounces of marijuana by people 21 and over.",
      "yes": 44,
      "no": 56
    },
    {
      "id": "referred-law-21",
      "label": "Referred Law 21",
      "title": "Regulation for Pipeline Commerce",
      "description": "This referendum lets voters decide whether to uphold a pipeline bill that was passed by legislators. The act would allow counties to set a surcharge on carbon dioxide pipelines of $1 per foot, which would be put toward tax relief for property owners in that county. It would also establish rules for pipelines including minimum depth and leak liability.",
      "yes": 41,
      "no": 59
    }
  ],
  "Utah": [
    {
      "id": "amendment-b",
      "label": "Amendment B",
      "title": "Raise School Fund Distribution Cap",
      "description": "This amendment would raise the limit on distributions from the permanent State School Fund to public schools. It would increase from a cap of 4% to 5% per year.",
      "yes": 71,
      "no": 29
    },
    {
      "id": "amendment-c",
      "label": "Amendment C",
      "title": "Elections of County Sheriffs",
      "description": "This would amend the state Constitution to make the office of county sheriff an elected position with four-year terms.",
      "yes": 83,
      "no": 17
    }
  ],
  "Virginia": [
    {
      "id": "question-sjr-501",
      "label": "Question SJR 501",
      "title": "Property Tax Exemption for Veterans and Surviving Spouses",
      "description": "This amendment would change language about a tax benefit that is given to spouses of soldiers “killed in action,” making it also available to spouses of soldiers “who died in the line of duty.”",
      "yes": 93,
      "no": 7,
      "choices": [
        "For",
        "Against"
      ]
    }
  ],
  "Washington": [
    {
      "id": "measure-2066",
      "label": "Measure 2066",
      "title": "Ensure Access to Natural Gas",
      "description": "This measure would repeal parts of the Washington Decarbonization Act that deter the use of natural gas, and it would require local governments and utilities to provide natural gas to customers who are eligible.",
      "yes": 52,
      "no": 48
    },
    {
      "id": "measure-2109",
      "label": "Measure 2109",
      "title": "Repeal Capital Gains Tax",
      "description": "This measure would eliminate a 7% tax on profits of over $250,000 derived from selling long-term capital assets.",
      "yes": 36,
      "no": 64
    },
    {
      "id": "measure-2117",
      "label": "Measure 2117",
      "title": "Prohibit Carbon Tax Credit Trading",
      "description": "This measure would block state agencies from imposing “cap and trade” programs to cut greenhouse gas emissions. It would also repeal the Washington Climate Commitment Act of 2021.",
      "yes": 38,
      "no": 62
    },
    {
      "id": "measure-2124",
      "label": "Measure 2124",
      "title": "Allow Employees to Opt Out of WA Cares",
      "description": "This measure would let people opt out of Washingtonʼs long-term care insurance program, which provides benefits like nursing home care. Those who exit the program would not be subject to the WA Cares payroll tax, and would not be eligible to receive benefits.",
      "yes": 38,
      "no": 62
    }
  ],
  "District of Columbia": [
    {
      "id": "initiative-83",
      "label": "Initiative 83",
      "title": "Establish Ranked-Choice Voting",
      "description": "This initiative would enable ranked choice voting starting in 2026, and would allow unaffiliated voters to cast ballots in a party primary.",
      "yes": 73,
      "no": 27
    }
  ],
  "West Virginia": [
    {
      "id": "constitutional-amendment-1",
      "label": "Constitutional Amendment 1",
      "title": "Prohibit Medically Assisted Suicide",
      "description": "This amendment would bar doctors, health care providers or others from participating in assisted suicide, euthanasia or mercy killing.",
      "yes": 50.4,
      "no": 49.6,
      "choices": [
        "For",
        "Against"
      ]
    }
  ],
  "Wisconsin": [
    {
      "id": "question-1",
      "label": "Question 1",
      "title": "Require Citizenship to Vote",
      "description": "This amendment would change the state Constitution to say that only U.S. citizens aged 18 and older can vote.",
      "yes": 71,
      "no": 29
    }
  ],
  "Wyoming": [
    {
      "id": "constitutional-amendment-a",
      "label": "Constitutional Amendment A",
      "title": "Create New Property Class",
      "description": "This amendment would make “residential real property” a separate class for property tax assessments. It would also enable the creation of an “owner-occupied primary residence” subcategory, which could be taxed at a different rate.",
      "yes": 59,
      "no": 41
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
    const choices = measure.choices || ["Yes", "No"];
    const hasResults = Number.isFinite(measure.yes) && Number.isFinite(measure.no);
    const winningChoice = hasResults ? choices[measure.yes > measure.no ? 0 : 1] : null;
    const percentage = (value) => Number.isFinite(value) ? `${value}%` : "—";
    return `
      <article class="ballot-measure" aria-labelledby="ballot-${measure.id}-title">
        <div class="ballot-measure-heading">
          <span class="ballot-measure-label">${measure.label}</span>
        </div>
        <h3 id="ballot-${measure.id}-title">${measure.title}</h3>
        <p class="ballot-measure-description">${measure.description}</p>
        <div class="ballot-measure-results" role="group" aria-label="${measure.label}: ${hasResults ? `${winningChoice} wins` : "results not provided"}">
          ${choices.map((choice, index) => `
            <div class="ballot-measure-choice${choice === winningChoice ? ` is-winner ballot-measure-choice--${index === 0 ? "yes" : "no"}` : ""}">
              <span>${choice}</span>
              <strong>${percentage(measure[index === 0 ? "yes" : "no"])}</strong>
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
