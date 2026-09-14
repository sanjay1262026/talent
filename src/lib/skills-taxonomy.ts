export const SKILL_TAXONOMY = {
  "Programming Languages": [
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "C", "Go", "Golang",
    "Rust", "Ruby", "PHP", "Swift", "Kotlin", "Scala", "R", "MATLAB", "Perl",
    "Bash", "Shell", "PowerShell", "Lua", "Dart", "Julia", "Haskell", "Elixir",
    "Clojure", "F#", "Groovy", "Assembly", "COBOL", "Fortran", "VBA",
  ],
  "Frameworks & Libraries": [
    "React", "Next.js", "Vue.js", "Angular", "Svelte", "Node.js", "Express",
    "Django", "Flask", "FastAPI", "Spring Boot", "Spring", "Hibernate", "Laravel",
    "Rails", "Ruby on Rails", "ASP.NET", ".NET", "Nest.js", "NestJS", "Nuxt.js",
    "Gatsby", "Remix", "Redux", "MobX", "Zustand", "GraphQL", "Apollo",
    "TailwindCSS", "Tailwind", "Bootstrap", "Material UI", "Chakra UI",
    "Styled Components", "Sass", "SCSS", "jQuery", "D3.js", "Three.js",
    "Socket.io", "gRPC", "REST", "RESTful", "Microservices",
  ],
  "Cloud & DevOps": [
    "AWS", "Azure", "GCP", "Google Cloud", "Docker", "Kubernetes", "K8s",
    "Terraform", "Ansible", "Jenkins", "GitLab CI", "GitHub Actions", "CircleCI",
    "Travis CI", "Helm", "Prometheus", "Grafana", "ELK Stack", "Elasticsearch",
    "Logstash", "Kibana", "Nginx", "Apache", "Linux", "Ubuntu", "CentOS",
    "Git", "GitHub", "GitLab", "Bitbucket", "CI/CD", "DevOps", "SRE",
    "CloudFormation", "Pulumi", "Serverless", "Lambda", "EC2", "S3", "RDS",
    "DynamoDB", "CloudWatch", "Azure DevOps", "GKE", "EKS", "AKS",
  ],
  "Data & AI": [
    "Machine Learning", "ML", "Deep Learning", "AI", "Artificial Intelligence",
    "TensorFlow", "PyTorch", "Keras", "Scikit-learn", "sklearn", "XGBoost",
    "LightGBM", "CatBoost", "Pandas", "NumPy", "Matplotlib", "Seaborn",
    "Plotly", "Jupyter", "NLP", "Natural Language Processing", "Computer Vision",
    "Transformers", "BERT", "GPT", "LLMs", "Hugging Face", "OpenAI",
    "Reinforcement Learning", "Data Science", "Data Analysis", "Data Engineering",
    "ETL", "Spark", "PySpark", "Hadoop", "Airflow", "dbt", "Kafka",
    "Statistical Analysis", "A/B Testing", "Feature Engineering",
    "Neural Networks", "CNN", "RNN", "LSTM", "GAN", "RAG", "Vector DB",
  ],
  "Databases": [
    "PostgreSQL", "MySQL", "SQLite", "MongoDB", "Redis", "Cassandra", "DynamoDB",
    "Oracle", "SQL Server", "MSSQL", "MariaDB", "CockroachDB", "Firestore",
    "Firebase", "Supabase", "Neo4j", "InfluxDB", "TimescaleDB", "Snowflake",
    "BigQuery", "Redshift", "Databricks", "SQL", "NoSQL", "GraphQL",
    "Pinecone", "Weaviate", "Chroma", "FAISS",
  ],
  "Soft Skills": [
    "Leadership", "Communication", "Team Player", "Collaboration", "Problem Solving",
    "Critical Thinking", "Adaptability", "Time Management", "Project Management",
    "Agile", "Scrum", "Kanban", "Jira", "Confluence", "Mentoring", "Public Speaking",
    "Documentation", "Research", "Innovation", "Strategic Thinking",
  ],
};

export const ALL_SKILLS = Object.values(SKILL_TAXONOMY).flat();

export const SKILL_SYNONYMS: Record<string, string[]> = {
  "Python": ["py"],
  "JavaScript": ["JS", "ECMAScript", "ES6", "ES2015"],
  "TypeScript": ["TS"],
  "Machine Learning": ["ML"],
  "Deep Learning": ["DL"],
  "Natural Language Processing": ["NLP", "Text Mining"],
  "Kubernetes": ["K8s"],
  "PostgreSQL": ["Postgres", "PG"],
  "MongoDB": ["Mongo"],
  "Google Cloud": ["GCP", "Google Cloud Platform"],
  "Next.js": ["NextJS"],
  "Node.js": ["NodeJS", "Node"],
  "React": ["ReactJS", "React.js"],
  "Vue.js": ["Vue", "VueJS"],
  "Angular": ["AngularJS"],
  "Ruby on Rails": ["Rails"],
  "Golang": ["Go"],
  "Spring Boot": ["Spring"],
};

export function normalizeSkill(skill: string): string {
  for (const [canonical, synonyms] of Object.entries(SKILL_SYNONYMS)) {
    if (synonyms.some(s => s.toLowerCase() === skill.toLowerCase())) {
      return canonical;
    }
  }
  return skill;
}

export const JOB_TEMPLATES = {
  "Senior AI/ML Engineer": {
    title: "Senior AI/ML Engineer",
    description: `We are seeking a highly skilled Senior AI/ML Engineer to join our cutting-edge AI team. The ideal candidate will have extensive experience in building and deploying machine learning models at scale.

Requirements:
- 5+ years of experience in machine learning and AI development
- PhD or Master's degree in Computer Science, Mathematics, Statistics, or related field
- Expert proficiency in Python, TensorFlow, PyTorch, and Scikit-learn
- Strong experience with NLP, Computer Vision, and Deep Learning architectures
- Experience with LLMs, Transformers, BERT, GPT models and fine-tuning
- Proficiency in cloud platforms (AWS, GCP, Azure) and MLOps practices
- Experience with Docker, Kubernetes, and CI/CD pipelines
- Strong knowledge of data engineering: Spark, Kafka, Airflow
- Experience with vector databases: Pinecone, Weaviate, FAISS
- Strong mathematical foundation: statistics, linear algebra, calculus
- Excellent problem-solving and communication skills

Responsibilities:
- Design and implement ML models and pipelines for production
- Lead research initiatives and stay current with AI advancements
- Mentor junior engineers and contribute to technical roadmap
- Collaborate cross-functionally with product and engineering teams`,
  },
  "Full Stack Developer": {
    title: "Senior Full Stack Developer",
    description: `We are looking for an experienced Full Stack Developer to build scalable web applications with modern technologies.

Requirements:
- 4+ years of experience in full stack development
- Bachelor's degree in Computer Science or related field
- Expert proficiency in React, Next.js, TypeScript, and Node.js
- Strong backend experience with Python, Django, or FastAPI
- Database expertise in PostgreSQL, MongoDB, and Redis
- Cloud experience with AWS or Azure (EC2, S3, Lambda, RDS)
- Experience with Docker, Kubernetes, and CI/CD pipelines
- Proficiency in Git, GitHub Actions, and DevOps practices
- Strong knowledge of RESTful APIs and GraphQL
- Experience with Tailwind CSS, Material UI, or similar frameworks
- Knowledge of Agile/Scrum methodologies

Responsibilities:
- Build and maintain responsive, scalable web applications
- Design and implement REST APIs and microservices
- Optimize application performance and security
- Collaborate with design and product teams`,
  },
  "Data Analyst": {
    title: "Senior Data Analyst",
    description: `We are hiring a Senior Data Analyst to transform complex datasets into actionable business insights.

Requirements:
- 3+ years of experience in data analysis or business intelligence
- Bachelor's degree in Statistics, Mathematics, Economics, or related field
- Expert SQL skills (PostgreSQL, MySQL, or similar)
- Proficiency in Python (Pandas, NumPy, Matplotlib, Seaborn) or R
- Experience with BI tools: Tableau, Power BI, or Looker
- Strong knowledge of statistical analysis and A/B testing
- Experience with cloud data warehouses: Snowflake, BigQuery, or Redshift
- Familiarity with dbt, Airflow, or similar data pipeline tools
- Excel proficiency and data visualization skills
- Strong communication and presentation skills
- Experience with Machine Learning concepts is a plus

Responsibilities:
- Analyze large datasets to identify trends and business opportunities
- Build dashboards and automated reporting pipelines
- Collaborate with stakeholders to define KPIs and metrics
- Conduct A/B tests and statistical experiments`,
  },
  "DevOps Engineer": {
    title: "Senior DevOps Engineer",
    description: `We are seeking an experienced DevOps Engineer to build and maintain our cloud infrastructure and CI/CD pipelines.

Requirements:
- 4+ years of experience in DevOps, SRE, or infrastructure engineering
- Bachelor's degree in Computer Science or related field
- Expert knowledge of AWS, GCP, or Azure cloud platforms
- Proficiency in Docker, Kubernetes, Helm, and container orchestration
- Strong experience with Terraform, Ansible, or CloudFormation (IaC)
- CI/CD pipeline expertise: Jenkins, GitHub Actions, GitLab CI, CircleCI
- Monitoring and observability: Prometheus, Grafana, ELK Stack
- Scripting skills: Python, Bash, PowerShell
- Experience with Nginx, Apache, and load balancers
- Strong Linux/Unix administration skills
- Knowledge of security best practices and compliance

Responsibilities:
- Design and maintain scalable cloud infrastructure
- Build and optimize CI/CD pipelines
- Monitor system performance and reliability
- Implement security and compliance controls`,
  },
};
