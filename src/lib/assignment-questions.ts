export interface QuestionCard {
  questionNumber: number;
  marks: number;
  description: string;
}

export function getQuestionsForAssignment(title: string, courseName: string): QuestionCard[] {
  const normTitle = title.toLowerCase();
  const normCourse = courseName.toLowerCase();

  // 1. Blockchain Technology
  if (normCourse.includes("blockchain") || normTitle.includes("blockchain")) {
    return [
      {
        questionNumber: 1,
        marks: 20,
        description: "Explain the fundamentals of Blockchain Technology and its key components, including cryptographic hash functions, blocks, and distributed ledgers.",
      },
      {
        questionNumber: 2,
        marks: 20,
        description: "Compare Public Blockchain and Private Blockchain with suitable examples, highlighting their trade-offs in terms of scalability, security, and decentralization.",
      },
      {
        questionNumber: 3,
        marks: 20,
        description: "Describe the consensus mechanisms used in blockchain systems. Detail the key differences between Proof of Work (PoW) and Proof of Stake (PoS).",
      },
      {
        questionNumber: 4,
        marks: 20,
        description: "Discuss real-world applications of blockchain in healthcare, finance, and education. Explain how smart contracts automate trust in these fields.",
      },
      {
        questionNumber: 5,
        marks: 20,
        description: "Write a short report on the future scope of blockchain technology. What are the potential challenges (e.g. energy consumption, scalability) that need to be resolved?",
      },
    ];
  }

  // 2. Data Structures & Algorithms
  if (normCourse.includes("structures") || normCourse.includes("algorithms") || normTitle.includes("structures") || normTitle.includes("algorithms")) {
    return [
      {
        questionNumber: 1,
        marks: 20,
        description: "Explain the differences between linear and non-linear data structures, providing examples of when to use each.",
      },
      {
        questionNumber: 2,
        marks: 20,
        description: "Define the Big O notation. Analyze the time and space complexity of Quick Sort and Merge Sort in the worst, best, and average cases.",
      },
      {
        questionNumber: 3,
        marks: 20,
        description: "Implement a function to detect a cycle in a singly linked list. Explain the mathematical basis of Floyd's Cycle-Finding Algorithm (Tortoise and Hare).",
      },
      {
        questionNumber: 4,
        marks: 20,
        description: "Describe Binary Search Trees (BST). Provide the pseudocode for inserting a node and finding the minimum element in a BST.",
      },
      {
        questionNumber: 5,
        marks: 20,
        description: "Discuss Dijkstra's algorithm for finding the shortest path in a graph. What are its limitations regarding negative edge weights?",
      },
    ];
  }

  // 3. Operating Systems
  if (normCourse.includes("operating") || normTitle.includes("operating") || normCourse.includes("os") || normTitle.includes("os")) {
    return [
      {
        questionNumber: 1,
        marks: 20,
        description: "Explain CPU scheduling algorithms (Round Robin, FCFS, SJF) and their performance tradeoffs regarding waiting time and turnaround time.",
      },
      {
        questionNumber: 2,
        marks: 20,
        description: "Describe the concept of process synchronization. Solve the classical Producer-Consumer problem using semaphores, writing clean pseudocode.",
      },
      {
        questionNumber: 3,
        marks: 20,
        description: "Compare paging and segmentation virtual memory techniques. Explain how translation lookaside buffers (TLBs) speed up address translation.",
      },
      {
        questionNumber: 4,
        marks: 20,
        description: "Discuss deadlock prevention, avoidance (using Banker's algorithm), and recovery mechanisms. Define the four necessary conditions for deadlock.",
      },
      {
        questionNumber: 5,
        marks: 20,
        description: "Write a brief summary on the design differences between monolithic kernel and microkernel architectures. Highlight their security and performance characteristics.",
      },
    ];
  }

  // 4. Machine Learning
  if (normCourse.includes("machine learning") || normTitle.includes("machine learning") || normCourse.includes("ml") || normTitle.includes("ml")) {
    return [
      {
        questionNumber: 1,
        marks: 20,
        description: "Explain the difference between supervised, unsupervised, and reinforcement learning. Provide real-world examples for each type.",
      },
      {
        questionNumber: 2,
        marks: 20,
        description: "Describe the mathematical formulation and cost functions of Linear Regression and Logistic Regression.",
      },
      {
        questionNumber: 3,
        marks: 20,
        description: "Discuss the concept of overfitting and underfitting. Explain regularization techniques (L1/Lasso and L2/Ridge) and how they mitigate overfitting.",
      },
      {
        questionNumber: 4,
        marks: 20,
        description: "Compare Decision Trees, Random Forests, and Support Vector Machines for binary classification tasks. What are their respective strengths?",
      },
      {
        questionNumber: 5,
        marks: 20,
        description: "Write a brief overview on evaluating model performance. Define confusion matrix, precision, recall, and F1-score.",
      },
    ];
  }

  // 5. Database Management Systems
  if (normCourse.includes("database") || normTitle.includes("database") || normCourse.includes("dbms") || normTitle.includes("dbms")) {
    return [
      {
        questionNumber: 1,
        marks: 20,
        description: "Explain the ACID properties of database transactions and explain how they guarantee data integrity during failures.",
      },
      {
        questionNumber: 2,
        marks: 20,
        description: "Describe the database normalization process. Define 1NF, 2NF, 3NF, and BCNF, giving examples of anomalies resolved at each stage.",
      },
      {
        questionNumber: 3,
        marks: 20,
        description: "Compare SQL (relational) and NoSQL (document/key-value) databases. Highlight their scalability and schema flexibility differences.",
      },
      {
        questionNumber: 4,
        marks: 20,
        description: "Discuss indexing in databases. Explain B-Trees and Hash indexes, and outline how they accelerate query execution.",
      },
      {
        questionNumber: 5,
        marks: 20,
        description: "Write SQL queries to join three tables (Students, Enrollments, Courses) to find the names of students enrolled in 'Operating Systems'.",
      },
    ];
  }

  // 6. Computer Networks
  if (normCourse.includes("networks") || normTitle.includes("networks")) {
    return [
      {
        questionNumber: 1,
        marks: 20,
        description: "Explain the seven layers of the OSI model and their corresponding protocols. Contrast it with the TCP/IP suite.",
      },
      {
        questionNumber: 2,
        marks: 20,
        description: "Describe the TCP three-way handshake process. How does TCP ensure reliable, ordered delivery of data packets?",
      },
      {
        questionNumber: 3,
        marks: 20,
        description: "Compare IPv4 and IPv6 protocols. Highlight the addressing schemes, header designs, and transition strategies.",
      },
      {
        questionNumber: 4,
        marks: 20,
        description: "Discuss routing algorithms. Explain the operational difference between Distance Vector Routing (RIP) and Link State Routing (OSPF).",
      },
      {
        questionNumber: 5,
        marks: 20,
        description: "Explain the Domain Name System (DNS) query resolution process. Detail how caching improves DNS performance.",
      },
    ];
  }

  // Fallback / General Assignment
  return [
    {
      questionNumber: 1,
      marks: 20,
      description: `Discuss the core concepts, fundamental principles, and historical background of ${courseName}.`,
    },
    {
      questionNumber: 2,
      marks: 20,
      description: `Explain the main technical challenges and state-of-the-art solutions associated with the topic: "${title}".`,
    },
    {
      questionNumber: 3,
      marks: 20,
      description: "Compare two different methodologies or approaches discussed in the course. Discuss their trade-offs in detail.",
    },
    {
      questionNumber: 4,
      marks: 20,
      description: `Analyze the real-world applications and societal impact of implementing the concepts covered in this assignment.`,
    },
    {
      questionNumber: 5,
      marks: 20,
      description: `Summarize the future trends, scope, and open research directions in this field.`,
    },
  ];
}
