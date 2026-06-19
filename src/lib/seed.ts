import mongoose from "mongoose";
import User from "@/models/User";
import Question from "@/models/Question";
import Exam from "@/models/Exam";

const MOCK_ADMIN_ID = new mongoose.Types.ObjectId("60c72b2f9b1d8e2568cf9023");

const QUESTIONS_SEED = [
  // SSC Questions
  {
    question: "If a + b = 8 and ab = 15, then what is the value of a³ + b³?",
    optionA: "152",
    optionB: "224",
    optionC: "356",
    optionD: "188",
    correctOption: "A",
    explanation: "a³ + b³ = (a + b)(a² - ab + b²)\nWe know (a + b)² = a² + b² + 2ab => 64 = a² + b² + 30 => a² + b² = 34.\nNow, a³ + b³ = 8 * (34 - 15) = 8 * 19 = 152.",
    examCategory: "SSC" as const,
    subject: "Quantitative Aptitude",
    topic: "Algebra",
    difficulty: "medium" as const,
    addedBy: MOCK_ADMIN_ID,
  },
  {
    question: "The ratio of the efficiency of A, B, and C is 2 : 5 : 3. Working together, they can complete a work in 27 days. In how many days can B alone complete 4/9th of the work?",
    optionA: "24",
    optionB: "18",
    optionC: "15",
    optionD: "21",
    correctOption: "A",
    explanation: "Total efficiency = 2 + 5 + 3 = 10.\nTotal work = Efficiency * Days = 10 * 27 = 270 units.\n4/9th of total work = 270 * 4/9 = 120 units.\nTime taken by B alone = 120 / B's efficiency = 120 / 5 = 24 days.",
    examCategory: "SSC" as const,
    subject: "Quantitative Aptitude",
    topic: "Time and Work",
    difficulty: "medium" as const,
    addedBy: MOCK_ADMIN_ID,
  },
  {
    question: "Pointing to a man, a woman said, 'His mother is the only daughter of my mother.' How is the woman related to the man?",
    optionA: "Sister",
    optionB: "Grandmother",
    optionC: "Mother",
    optionD: "Aunt",
    correctOption: "C",
    explanation: "Woman's mother's only daughter is the woman herself. So, the man's mother is the woman herself. Therefore, the woman is the mother of the man.",
    examCategory: "SSC" as const,
    subject: "Reasoning",
    topic: "Blood Relations",
    difficulty: "easy" as const,
    addedBy: MOCK_ADMIN_ID,
  },
  {
    question: "Select the antonym of the given word: OBSCURE",
    optionA: "Vague",
    optionB: "Clear",
    optionC: "Doubtful",
    optionD: "Hidden",
    correctOption: "B",
    explanation: "Obscure means not discovered or known about; uncertain. Clear is the direct antonym, meaning easy to perceive, understand, or interpret.",
    examCategory: "SSC" as const,
    subject: "English",
    topic: "Vocabulary",
    difficulty: "easy" as const,
    addedBy: MOCK_ADMIN_ID,
  },
  {
    question: "Who among the following was the founder of the Maurya Empire?",
    optionA: "Ashoka",
    optionB: "Chandragupta Maurya",
    optionC: "Bindusara",
    optionD: "Harsha",
    correctOption: "B",
    explanation: "Chandragupta Maurya founded the Maurya Empire in 322 BCE after defeating the Nanda dynasty with the help of Chanakya.",
    examCategory: "SSC" as const,
    subject: "GK",
    topic: "Ancient Indian History",
    difficulty: "easy" as const,
    addedBy: MOCK_ADMIN_ID,
  },

  // Railway Questions
  {
    question: "Which of the following is a unit of power?",
    optionA: "Joule",
    optionB: "Newton",
    optionC: "Watt",
    optionD: "Pascal",
    correctOption: "C",
    explanation: "Watt is the SI unit of power, defined as one joule per second. Joule is for energy, Newton for force, and Pascal for pressure.",
    examCategory: "Railway" as const,
    subject: "General Awareness",
    topic: "Physics",
    difficulty: "easy" as const,
    addedBy: MOCK_ADMIN_ID,
  },
  {
    question: "The chemical formula of Common Salt is:",
    optionA: "NaCl",
    optionB: "KCl",
    optionC: "HCl",
    optionD: "NaOH",
    correctOption: "A",
    explanation: "Common salt is Sodium Chloride, which has the chemical formula NaCl.",
    examCategory: "Railway" as const,
    subject: "General Awareness",
    topic: "Chemistry",
    difficulty: "easy" as const,
    addedBy: MOCK_ADMIN_ID,
  },
  {
    question: "Find the missing number in the series: 4, 9, 19, 39, ?, 159",
    optionA: "79",
    optionB: "89",
    optionC: "69",
    optionD: "74",
    correctOption: "A",
    explanation: "The pattern is: (Previous number * 2) + 1.\n(4*2)+1=9\n(9*2)+1=19\n(19*2)+1=39\n(39*2)+1=79\n(79*2)+1=159.",
    examCategory: "Railway" as const,
    subject: "General Intelligence & Reasoning",
    topic: "Number Series",
    difficulty: "easy" as const,
    addedBy: MOCK_ADMIN_ID,
  },
  {
    question: "The simple interest on a sum of money for 3 years at 10% per annum is Rs. 1500. What is the sum of money?",
    optionA: "Rs. 4500",
    optionB: "Rs. 5000",
    optionC: "Rs. 6000",
    optionD: "Rs. 4000",
    correctOption: "B",
    explanation: "SI = (P * R * T) / 100\n1500 = (P * 10 * 3) / 100\n1500 = P * 0.3 => P = 1500 / 0.3 = 5000.",
    examCategory: "Railway" as const,
    subject: "Mathematics",
    topic: "Simple Interest",
    difficulty: "easy" as const,
    addedBy: MOCK_ADMIN_ID,
  },
  {
    question: "What is the speed of light in vacuum?",
    optionA: "3 x 10^8 m/s",
    optionB: "3 x 10^6 m/s",
    optionC: "3 x 10^10 m/s",
    optionD: "1.5 x 10^8 m/s",
    correctOption: "A",
    explanation: "The speed of light in vacuum is approximately 300,000 kilometers per second, or 3 x 10^8 meters per second.",
    examCategory: "Railway" as const,
    subject: "General Awareness",
    topic: "Physics",
    difficulty: "easy" as const,
    addedBy: MOCK_ADMIN_ID,
  },

  // Banking Questions
  {
    question: "Select the word that is most nearly SIMILAR in meaning to: RESILIENT",
    optionA: "Weak",
    optionB: "Elastic",
    optionC: "Rigid",
    optionD: "Stiff",
    correctOption: "B",
    explanation: "Resilient means able to withstand or recover quickly from difficult conditions, or able to recoil/spring back into shape. Elastic is the most similar.",
    examCategory: "Banking" as const,
    subject: "English Language",
    topic: "Synonyms",
    difficulty: "medium" as const,
    addedBy: MOCK_ADMIN_ID,
  },
  {
    question: "A train running at the speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train?",
    optionA: "120 meters",
    optionB: "180 meters",
    optionC: "324 meters",
    optionD: "150 meters",
    correctOption: "D",
    explanation: "Speed = 60 km/hr = 60 * 5/18 = 50/3 m/s.\nLength of train (Distance) = Speed * Time = (50/3) * 9 = 150 meters.",
    examCategory: "Banking" as const,
    subject: "Quantitative Aptitude",
    topic: "Speed and Distance",
    difficulty: "medium" as const,
    addedBy: MOCK_ADMIN_ID,
  },
  {
    question: "In a certain code, 'MONKEY' is written as 'XDJMNL'. How is 'TIGER' written in that code?",
    optionA: "QDFHS",
    optionB: "SDFHS",
    optionC: "QDFHR",
    optionD: "UJHFS",
    correctOption: "A",
    explanation: "The letters of the word are written in reverse order and each letter is decremented by 1.\nMONKEY reversed = YEKNOM.\nY-1=X, E-1=D, K-1=J, N-1=M, O-1=N, M-1=L => XDJMNL.\nTIGER reversed = REGIT.\nR-1=Q, E-1=D, G-1=F, I-1=H, T-1=S => QDFHS.",
    examCategory: "Banking" as const,
    subject: "Reasoning Ability",
    topic: "Coding-Decoding",
    difficulty: "hard" as const,
    addedBy: MOCK_ADMIN_ID,
  },

  // State PSC Questions
  {
    question: "Which article of the Indian Constitution deals with the Amendment procedure?",
    optionA: "Article 356",
    optionB: "Article 368",
    optionC: "Article 370",
    optionD: "Article 360",
    correctOption: "B",
    explanation: "Article 368 in Part XX of the Indian Constitution deals with the powers of Parliament to amend the Constitution and its procedure.",
    examCategory: "PSC" as const,
    subject: "General Studies",
    topic: "Indian Polity",
    difficulty: "medium" as const,
    addedBy: MOCK_ADMIN_ID,
  },
  {
    question: "The Battle of Plassey was fought in which year?",
    optionA: "1757",
    optionB: "1764",
    optionC: "1782",
    optionD: "1857",
    correctOption: "A",
    explanation: "The Battle of Plassey was fought on June 23, 1757, between the Nawab of Bengal (Siraj-ud-Daulah) and the British East India Company forces led by Robert Clive.",
    examCategory: "PSC" as const,
    subject: "General Studies",
    topic: "Modern Indian History",
    difficulty: "medium" as const,
    addedBy: MOCK_ADMIN_ID,
  }
];

export async function seedDatabase() {
  try {
    // 1. Ensure mock admin user exists
    let admin = await User.findById(MOCK_ADMIN_ID);
    if (!admin) {
      admin = await User.create({
        _id: MOCK_ADMIN_ID,
        googleId: "mock-admin-google-id",
        name: "Exam Administrator",
        email: "admin@mocktestpro.com",
        avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Admin",
        role: "admin",
        streak: 5,
        isBanned: false,
        lastLogin: new Date(),
      });
      console.log("Mock Admin seeded successfully.");
    }

    // 2. Seed Questions if bank is empty
    const questionCount = await Question.countDocuments({});
    let insertedQuestions = [];
    
    if (questionCount === 0) {
      insertedQuestions = await Question.insertMany(QUESTIONS_SEED);
      console.log(`Seeded ${insertedQuestions.length} practice questions.`);
    } else {
      insertedQuestions = await Question.find({});
    }

    // Helper to get question IDs by category and subject
    const getQIds = (cat: string, sub: string) => {
      return insertedQuestions
        .filter((q) => q.examCategory === cat && q.subject === sub)
        .map((q) => q._id);
    };

    // 3. Seed Exams if empty
    const examCount = await Exam.countDocuments({});
    if (examCount === 0) {
      const examsToCreate = [
        {
          title: "SSC CGL Tier 1 - Full Mock Test #1",
          category: "SSC" as const,
          totalDuration: 60,
          instructions: "This test consists of 4 sections: Reasoning, Quantitative Aptitude, English, and GK. Each section is time-locked and contains practice questions. Total duration is 60 minutes. Correct answer gives +2 marks and wrong answer deducts 0.5 marks.",
          status: "published" as const,
          createdBy: MOCK_ADMIN_ID,
          attemptCount: 142,
          sections: [
            {
              name: "Reasoning",
              duration: 15,
              questionCount: 1,
              questions: getQIds("SSC", "Reasoning"),
              markingScheme: { correct: 2, wrong: -0.5 },
            },
            {
              name: "Quantitative Aptitude",
              duration: 15,
              questionCount: 2,
              questions: getQIds("SSC", "Quantitative Aptitude"),
              markingScheme: { correct: 2, wrong: -0.5 },
            },
            {
              name: "English",
              duration: 15,
              questionCount: 1,
              questions: getQIds("SSC", "English"),
              markingScheme: { correct: 2, wrong: -0.5 },
            },
            {
              name: "GK",
              duration: 15,
              questionCount: 1,
              questions: getQIds("SSC", "GK"),
              markingScheme: { correct: 2, wrong: -0.5 },
            },
          ],
        },
        {
          title: "RRB NTPC CBT 1 - Stage 1 Mock Test",
          category: "Railway" as const,
          totalDuration: 90,
          instructions: "Standard RRB NTPC pattern. Sections: Mathematics, Reasoning, and General Awareness. Negative marking applies (-1/3 per wrong answer). Correct answer gives +1.",
          status: "published" as const,
          createdBy: MOCK_ADMIN_ID,
          attemptCount: 89,
          sections: [
            {
              name: "Mathematics",
              duration: 30,
              questionCount: 1,
              questions: getQIds("Railway", "Mathematics"),
              markingScheme: { correct: 1, wrong: -0.33 },
            },
            {
              name: "General Intelligence & Reasoning",
              duration: 30,
              questionCount: 1,
              questions: getQIds("Railway", "General Intelligence & Reasoning"),
              markingScheme: { correct: 1, wrong: -0.33 },
            },
            {
              name: "General Awareness",
              duration: 30,
              questionCount: 3,
              questions: getQIds("Railway", "General Awareness"),
              markingScheme: { correct: 1, wrong: -0.33 },
            },
          ],
        },
        {
          title: "IBPS PO Prelims - Practice Mock #1",
          category: "Banking" as const,
          totalDuration: 60,
          instructions: "Banking Prelims Pattern with 3 sections. Each section has a 20-minute timer. Correct answers are +1, incorrect are -0.25.",
          status: "published" as const,
          createdBy: MOCK_ADMIN_ID,
          attemptCount: 57,
          sections: [
            {
              name: "English Language",
              duration: 20,
              questionCount: 1,
              questions: getQIds("Banking", "English Language"),
              markingScheme: { correct: 1, wrong: -0.25 },
            },
            {
              name: "Quantitative Aptitude",
              duration: 20,
              questionCount: 1,
              questions: getQIds("Banking", "Quantitative Aptitude"),
              markingScheme: { correct: 1, wrong: -0.25 },
            },
            {
              name: "Reasoning Ability",
              duration: 20,
              questionCount: 1,
              questions: getQIds("Banking", "Reasoning Ability"),
              markingScheme: { correct: 1, wrong: -0.25 },
            },
          ],
        },
        {
          title: "WBPSC State General Studies Mock #1",
          category: "PSC" as const,
          totalDuration: 60,
          instructions: "WBPSC General Studies Mock Exam. Features general syllabus questions. Each correct answer gains 1 mark, wrong answer loses 0.33 marks.",
          status: "published" as const,
          createdBy: MOCK_ADMIN_ID,
          attemptCount: 38,
          sections: [
            {
              name: "General Studies",
              duration: 60,
              questionCount: 2,
              questions: getQIds("PSC", "General Studies"),
              markingScheme: { correct: 1, wrong: -0.33 },
            },
          ],
        },
      ];

      await Exam.insertMany(examsToCreate);
      console.log("Seeded 4 default mock exams.");
    }
  } catch (error) {
    console.error("Failed to seed database:", error);
  }
}
