const GENERAL_PRESET_TAGS = {
    'Android Development': {
        count: 0,
        description: 'Software development for the Android mobile platform developed by Google.',
        tag_code: 'android developer',
        tag_title: 'Android Developer'
    },
    'Java': {
        count: 0,
        description: 'Java is a general-purpose computer-programming language that is concurrent, class-based, object-oriented,and specifically designed to have as few implementation dependencies as possible. ',
        tag_code: 'java',
        tag_title: 'Java'
    },
    'C++': {
        count: 0,
        description: 'C++ is a general-purpose programming language. It has imperative, object-oriented and generic programming features, while also providing facilities for low-level memory manipulation.',
        tag_code: 'c++',
        tag_title: 'C++'
    },
    'C': {
        count: 0,
        description: 'C is a general-purpose, imperative computer programming language, supporting structured programming, lexical variable scope and recursion. By design, C provides constructs that map efficiently to typical machine instructions.',
        tag_code: 'c',
        tag_title: 'C'
    },
    'Javascript': {
        count: 0,
        description: 'JavaScript often abbreviated as JS, is a high-level, interpreted programming language. It is a language which is also characterized as dynamic, weakly typed, prototype-based and multi-paradigm.',
        tag_code: 'javascript',
        tag_title: 'Javascript'
    },
    'Python': {
        count: 0,
        description: 'Python is an interpreted high-level programming language for general-purpose programming. Created by Guido van Rossum and first released in 1991, Python has a design philosophy that emphasizes code readability, notably using significant whitespace.',
        tag_code: 'python',
        tag_title: 'Python'
    },
    'SQL': {
        count: 0,
        description: 'SQL (Standard Query Language) is a domain-specific language used in programming and designed for managing data held in a relational database management system (RDBMS), or for stream processing in a relational data stream management system (RDSMS).',
        tag_code: 'sql',
        tag_title: 'SQL'
    },
    'HTML': {
        count: 0,
        description: 'Hypertext Markup Language (HTML) is the standard markup language for creating web pages and web applications.',
        tag_code: 'html',
        tag_title: 'HTML'
    },
    'CSS': {
        count: 0,
        description: 'Cascading Style Sheets (CSS) is a style sheet language used for describing the presentation of a document written in a markup language like HTML.',
        tag_code: 'css',
        tag_title: 'CSS'
    },
    'Angular': {
        count: 0,
        description: 'Angular is a TypeScript-based open-source front-end web application platform led by the Angular Team at Google and by a community of individuals and corporations.',
        tag_code: 'angular',
        tag_title: 'Angular'
    },
    'React': {
        count: 0,
        description: 'In computing, React (also known as React.js or ReactJS) is a JavaScript library for building user interfaces. It is maintained by Facebook and a community of individual developers and companies.',
        tag_code: 'react js',
        tag_title: 'React JS'
    },
    'ExpressJS': {
        count: 0,
        description: 'Express.js, or simply Express, is a web application framework for Node.js, released as free and open-source software under the MIT License. It is designed for building web applications and APIs. It has been called the de facto standard server framework for Node.js.',
        tag_code: 'expressjs',
        tag_title: 'ExpressJS'
    },
    'Microservices': {
        count: 0,
        description: 'Microservices are a software development technique—a variant of the service-oriented architecture (SOA) architectural style that structures an application as a collection of loosely coupled services. In a microservices architecture, services are fine-grained and the protocols are lightweight.',
        tag_code: 'microservices',
        tag_title: 'Microservices'
    },
    'Cloud Infrastructure': {
        count: 0,
        description: 'Service orientated architecture design for cloud computing models and protocols.',
        tag_code: 'cloud infrastructure',
        tag_title: 'Cloud Infrastructure'
    },
    'Agile Methodology': {
        count: 0,
        description: 'Agile software development is an approach to software development under which requirements and solutions evolve through the collaborative effort of self-organizing and cross-functional teams and their customer(s)/end user(s). It advocates adaptive planning, evolutionary development, early delivery, and continual improvement, and it encourages rapid and flexible response to change.',
        tag_code: 'agile methodology',
        tag_title: 'Agile Methodology'
    },
    'Project Management': {
        count: 0,
        description: 'Project management is the practice of initiating, planning, executing, controlling, and closing the work of a team to achieve specific goals and meet specific success criteria at the specified time.',
        tag_code: 'project management',
        tag_title: 'Project Management'
    },
    'Trello': {
        count: 0,
        description: 'Trello is a web-based project management application originally made by Fog Creek Software in 2011, that was spun out to form the basis of a separate company in 2014 and later sold to Atlassian in January 2017.',
        tag_code: 'trello',
        tag_title: 'Trello'
    },
    'JIRA': {
        count: 0,
        description: 'Jira is a proprietary issue tracking product developed by Atlassian which allows bug tracking and agile project management.',
        tag_code: 'jira',
        tag_title: 'JIRA'
    },
    'Machine Learning': {
        count: 0,
        description: 'Machine learning (ML) is a field of artificial intelligence that uses statistical techniques to give computer systems the ability to "learn" (e.g., progressively improve performance on a specific task) from data, without being explicitly programmed.',
        tag_code: 'machine learning',
        tag_title: 'Machine Learning'
    },
    'R': {
        count: 0,
        description: 'R is a programming language and free software environment for statistical computing and graphics supported by the R Foundation for Statistical Computing. The R language is widely used among statisticians and data miners for developing statistical software and data analysis.',
        tag_code: 'r',
        tag_title: 'R'
    },
    'Data Science': {
        count: 0,
        description: 'Data science is an interdisciplinary field that uses scientific methods, processes, algorithms and systems to extract knowledge and insights from data in various forms, both structured and unstructured, similar to data mining.',
        tag_code: 'data science',
        tag_title: 'Data Science'
    },
    'Matlab': {
        count: 0,
        description: 'MATLAB (matrix laboratory) is a multi-paradigm numerical computing environment and proprietary programming language developed by MathWorks. MATLAB allows matrix manipulations, plotting of functions and data, implementation of algorithms, creation of user interfaces, and interfacing with programs written in other languages, including C, C++, C#, Java, Fortran and Python.',
        tag_code: 'matlab',
        tag_title: 'Matlab'
    },
    'Simulink': {
        count: 0,
        description: 'Simulink, developed by MathWorks, is a graphical programming environment for modeling, simulating and analyzing multi-domain dynamical systems. Its primary interface is a graphical block diagramming tool and a customizable set of block libraries.',
        tag_code: 'simulink',
        tag_title: 'Simulink'
    },
    'Docker': {
        count: 0,
        description: 'Docker is used to run software packages called "containers". Containers are isolated from each other and bundle their own tools, libraries and configuration files; they can communicate with each other through well-defined channels. All containers are run by a single operating system kernel and are thus more lightweight than virtual machines.',
        tag_code: 'docker',
        tag_title: 'Docker'
    },
    'Jenkins': {
        count: 0,
        description: 'Jenkins is an open source automation server written in Java. Jenkins helps to automate the non-human part of the software development process, with continuous integration and facilitating technical aspects of continuous delivery.',
        tag_code: 'jenkins',
        tag_title: 'Jenkins'
    },
    'Kubernetes': {
        count: 0,
        description: 'Kubernetes is an open-source container-orchestration system for automating deployment, scaling and management of containerized applications.',
        tag_code: 'kubernetes',
        tag_title: 'Kubernetes'
    },
    'Data Visualization': {
        count: 0,
        description: 'Data visualization is viewed by many disciplines as a modern equivalent of visual communication. It involves the creation and study of the visual representation of data.',
        tag_code: 'data visualization',
        tag_title: 'Data Visualization'
    },
    'Deep Learning': {
        count: 0,
        description: 'Deep learning (also known as deep structured learning or hierarchical learning) is part of a broader family of machine learning methods based on learning data representations, as opposed to task-specific algorithms. Learning can be supervised, semi-supervised or unsupervised.',
        tag_code: 'deep learning',
        tag_title: 'Deep Learning'
    },
    'Reinforcement Learning': {
        count: 0,
        description: 'Reinforcement learning (RL) is an area of machine learning concerned with how software agents ought to take actions in an environment so as to maximize some notion of cumulative reward. The problem, due to its generality, is studied in many other disciplines, such as game theory, control theory, operations research, information theory, simulation-based optimization, multi-agent systems, swarm intelligence, statistics and genetic algorithms.',
        tag_code: 'reinforcement learning',
        tag_title: 'Reinforcement Learning'
    },
    'Design Thinking': {
        count: 0,
        description: 'Design thinking refers to the cognitive, strategic and practical processes by which design concepts (proposals for new products, buildings, machines, etc.) are developed by designers and/or design teams.',
        tag_code: 'design thinking',
        tag_title: 'Design Thinking'
    },
    'Graphic Design': {
        count: 0,
        description: 'Graphic design is the process of visual communication and problem-solving through the use of typography, photography and illustration.',
        tag_code: 'graphic design',
        tag_title: 'Graphic Design'
    },
    'iOS Development': {
        count: 0,
        description: 'Software developer for the iOS software platform developed by Apple.',
        tag_code: 'ios developer',
        tag_title: 'iOS Developer'
    },
    'Adobe Creative Cloud': {
        count: 0,
        description: 'Adobe Creative Cloud is a set of applications and services from Adobe Systems that gives subscribers access to a collection of software used for graphic design, video editing, web development, photography, along with a set of mobile applications and also some optional cloud services.',
        tag_code: 'adobe creative cloud',
        tag_title: 'Adobe Creative Cloud'
    },
    'Adobe Illustrator': {
        count: 0,
        description: 'Adobe Illustrator is a vector graphics editor developed and marketed by Adobe Systems.',
        tag_code: 'adobe illustrator',
        tag_title: 'Adobe Illustrator'
    },
    'Photoshop': {
        count: 0,
        description: 'Adobe Photoshop is a raster graphics editor developed and published by Adobe Systems for macOS and Windows.',
        tag_code: 'photoshop',
        tag_title: 'Photoshop'
    },
    'Inkscape': {
        count: 0,
        description: "Inkscape is a free and open-source vector graphics editor; it can be used to create or edit vector graphics such as illustrations, diagrams, line arts, charts, logos and complex paintings. Inkscape's primary vector graphics format is Scalable Vector Graphics (SVG); however, many other formats can be imported and exported.",
        tag_code: 'inkscape',
        tag_title: 'Inkscape'
    },
    'NoSQL Databases': {
        count: 0,
        description: 'A NoSQL (originally referring to "non SQL" or "non relational") database provides a mechanism for storage and retrieval of data that is modeled in means other than the tabular relations used in relational databases.',
        tag_code: 'nosql databases',
        tag_title: 'NoSQL Databases'
    },
    'MySQL': {
        count: 0,
        description: 'MySQL is an open-source relational database management system (RDBMS).',
        tag_code: 'mysql databases',
        tag_title: 'MySQL Databases'
    },
    'Slack': {
        count: 0,
        description: 'Slack is a cloud-based set of proprietary team collaboration tools and services, founded by Stewart Butterfield.',
        tag_code: 'slack',
        tag_title: 'Slack'
    },
    'Kafka': {
        count: 0,
        description: 'Apache Kafka is an open-source stream-processing software platform developed by the Apache Software Foundation, written in Scala and Java. The project aims to provide a unified, high-throughput, low-latency platform for handling real-time data feeds.',
        tag_code: 'apache kafka',
        tag_title: 'Apache Kafka'
    },
    'IBM Bluemix': {
        count: 0,
        description: 'IBM Bluemix is a cloud platform as a service (PaaS) developed by IBM. It supports several programming languages and services as well as integrated DevOps to build, run, deploy and manage applications on the cloud.',
        tag_code: 'ibm bluemix',
        tag_title: 'IBM Bluemix'
    },
    'Pivotal Cloud Foundry': {
        count: 0,
        description: 'Cloud Foundry is an open source, multi-cloud application platform as a service (PaaS) governed by the Cloud Foundry Foundation. ',
        tag_code: 'pivotal cloud foundry',
        tag_title: 'Pivotal Cloud Foundry'
    },
    'Blockchain': {
        count: 0,
        description: 'A blockchain, originally block chain, is a growing list of records, called blocks, which are linked using cryptography. Each block contains a cryptographic hash of the previous block, a timestamp, and transaction data (generally represented as a merkle tree root hash).',
        tag_code: 'blockchain',
        tag_title: 'Blockchain'
    },
    'Git': {
        count: 0,
        description: 'Git is a version-control system for tracking changes in computer files and coordinating work on those files among multiple people. It is primarily used for source-code management in software development, but it can be used to keep track of changes in any set of files.',
        tag_code: 'git',
        tag_title: 'Git'
    },
    'Google Firebase': {
        count: 0,
        description: 'Firebase is a mobile and web application development platform developed by Firebase.',
        tag_code: 'google firebase',
        tag_title: 'Google Firebase'
    },
    'AWS': {
        count: 0,
        description: 'Amazon Web Services (AWS) is a subsidiary of Amazon.com that provides on-demand cloud computing platforms to individuals, companies and governments, on a paid subscription basis. The technology allows subscribers to have at their disposal a virtual cluster of computers, available all the time, through the Internet.',
        tag_code: 'aws',
        tag_title: 'AWS'
    },
    'Continuous Integration': {
        count: 0,
        description: 'In software engineering, continuous integration (CI) is the practice of merging all developer working copies to a shared mainline several times a day.',
        tag_code: 'continuous integration',
        tag_title: 'Continuous Integration'
    },
    'Github': {
        count: 0,
        description: 'GitHub Inc. is a web-based hosting service for version control using Git. It is mostly used for computer code. It offers all of the distributed version control and source code management (SCM) functionality of Git as well as adding its own features.',
        tag_code: 'github',
        tag_title: 'Github'
    },
    'Bitbucket': {
        count: 0,
        description: 'Bitbucket is a web-based version control repository hosting service owned by Atlassian, for source code and development projects that use either Mercurial (since launch) or Git (since October 2011) revision control systems.',
        tag_code: 'bitbucket',
        tag_title: 'Bitbucket'
    },
    'Microsoft Excel': {
        count: 0,
        description: 'Microsoft Excel is a spreadsheet developed by Microsoft for Windows, macOS, Android and iOS. It features calculation, graphing tools, pivot tables, and a macro programming language called Visual Basic for Applications.',
        tag_code: 'microsoft excel',
        tag_title: 'Microsoft Excel'
    },
    'Microsoft Access': {
        count: 0,
        description: 'Microsoft Access is a database management system (DBMS) from Microsoft that combines the relational Microsoft Jet Database Engine with a graphical user interface and software-development tools.',
        tag_code: 'microsoft access',
        tag_title: 'Microsoft Access'
    },
    'PHP': {
        count: 0,
        description: 'PHP: Hypertext Preprocessor (or simply PHP) is a server-side scripting language designed for Web development, and also used as a general-purpose programming language.',
        tag_code: 'php',
        tag_title: 'PHP'
    },
    'Curl': {
        count: 0,
        description: 'Curl is a reflective object-oriented programming language for interactive web applications whose goal is to provide a smoother transition between formatting and programming. It makes it possible to embed complex objects in simple documents without needing to switch between programming languages or development platforms.',
        tag_code: 'curl',
        tag_title: 'Curl'
    },
    'Vue&1111js': {
        count: 0,
        description: 'Vue.js is an open-source JavaScript framework for building user interfaces. Integration into projects that use other JavaScript libraries is simplified with Vue because it is designed to be incrementally adoptable.',
        tag_code: 'vue.js',
        tag_title: 'Vue.js'
    },
    'Ruby': {
        count: 0,
        description: 'A dynamic, open source programming language with a focus on simplicity and productivity. It has an elegant syntax that is natural to read and easy to write.',
        tag_code: 'ruby',
        'tag_title': 'Ruby'
    },
    'Swift': {
        count: 0,
        description: 'Swift is a general-purpose programming language built using a modern approach to safety, performance, and software design patterns.',
        tag_code: 'swift',
        tag_title: 'Swift'
    },
    'MongoDB': {
        count: 0,
        description: 'MongoDB is a free and open-source cross-platform document-oriented database program. Classified as a NoSQL database program, MongoDB uses JSON-like documents with schemas.',
        tag_code: 'mongodb',
        tag_title: 'MongoDB'
    },
    'Node&1111js': {
        count: 0,
        description: 'Node.js is an open-source, cross-platform JavaScript run-time environment that executes JavaScript code server-side. ',
        tag_code: 'node.js',
        tag_title: 'Node.js'
    },
    'jQuery': {
        count: 0,
        description: 'jQuery is a cross-platform JavaScript library designed to simplify the client-side scripting of HTML.',
        tag_code: 'jquery',
        tag_title: 'jQuery'
    },
    'SCRUM': {
        count: 0,
        description: 'Scrum is an agile framework for managing work with an emphasis on software development.',
        tag_code: 'scrum',
        tag_title: 'SCRUM'
    },   
    'UI&1116UX': {
        count: 0,
        description: 'Design practices about enhancing the accessability and usability of a user interface, and the user experience overall.',
        tag_code: 'ui/ux',
        tag_title: 'UI/UX'
    },
    'Business Scaling' : {
        count : 0,
        description : 'The goal of expanding and growing the profit, sales, user base, or general business presence of a company.',
        tag_code : 'business scaling',
        tag_title : 'Business Scaling',
    },
    'QA Testing' : {
        count : 0,
        description : 'Quality assurance is a way of preventing mistakes and defects in manufactured products and avoiding problems when delivering solutions or services to customers.',
        tag_code : 'qa testing',
        tag_title : 'QA Testing',
    }
}

/**
 * JSON object holding the premade options groupings.
 * Current count = 44/100
 */
const starting_options = {
    'option_groups': [
        {
            'label': 'Application and Data',
            'options': [
                {
                    'label': 'Python',
                    'value': 'Python',
                },
                {
                    'label': 'Java',
                    'value': 'Java',
                },
                {
                    'label': 'Javascript',
                    'value': 'Javascript',
                },
                {
                    'label': 'PHP',
                    'value': 'PHP',
                },
                {
                    'label': 'Rubv',
                    'value': 'Ruby',
                },
                {
                    'label': 'C++',
                    'value': 'C++',
                },
                {
                    'label': 'C',
                    'value': 'C',
                },
                {
                    'label': 'Matlab',
                    'value': 'Matlab',
                },
                {
                    'label': 'Swift',
                    'value': 'Swift',
                },
                {
                    'label': 'R',
                    'value': 'R',
                },
                {
                    'label': 'SQL',
                    'value': 'SQL',
                },
                {
                    'label': 'MySQL',
                    'value': 'MySQL',
                },
                {
                    'label': 'MongoDB',
                    'value': 'MongoDB',
                },
                {
                    'label': 'Node.js',
                    'value': 'Node.js',
                },
                {
                    'label': 'React',
                    'value': 'React',
                },
                {
                    'label' : 'Android Development',
                    'value' : 'Android Development'
                },
                {
                    'label': 'Angular',
                    'value': 'Anuglar',
                },
                {
                    'label': 'jQuery',
                    'value': 'jQuery',
                },
                {
                    'label': 'Kafka',
                    'value': 'Kafka',
                },
                {
                    'label': 'HTML',
                    'value': 'HTML',
                },
                {
                    'label': 'CSS',
                    'value': 'CSS',
                },
                {
                    'label': 'Vue.js',
                    'value': 'Vue.js',
                },
                {
                    'label' : 'Microservices',
                    'value' : 'Microservices'
                },
                {
                    'label' : 'Machine Learning',
                    'value' : 'Machine Learning'
                },
                {
                    'label' : 'Docker',
                    'value' : 'Docker'
                },


            ]
        },
        {
            'label': 'DevOps',
            'options': [
                {
                    'label': 'Github',
                    'value': 'Github'
                },
                {
                    'label': 'Bitbucket',
                    'value': 'Bitbucket'
                },
                {
                    'label': 'Git',
                    'value': 'Git'
                },
                {
                    'label': 'Jenkins',
                    'value': 'Jenkins'
                },
            ]
        },
        {
            'label': 'Business Tools',
            'options': [
                {
                    'label': 'Slack',
                    'value': 'Slack'
                },
                {
                    'label': 'Microsoft Excel',
                    'value': 'Microsoft Excel'
                },
                {
                    'label' : 'Microsoft Access',
                    'value' : 'Microsoft Access'
                },
                {
                    'label': 'JIRA',
                    'value': 'JIRA'
                },
                {
                    'label': 'Trello',
                    'value': 'Trello'
                },
                {
                    'label': 'Project Management',
                    'value': 'Project Management'
                },
                {
                    'label' : 'AWS',
                    'value' : 'AWS'
                },
                {
                    'label' : 'Google Firebase',
                    'value' : 'Google Firebase'
                }
            ]
        },
        {
            'label' : 'Business Practices',
            'options' : [
                {
                    'label' : 'Agile Methodology',
                    'value' : 'Agile Methodology'
                },
                {
                    'label' : 'Design Thinking',
                    'value' : 'Design Thinking'
                },
                {
                    'label' : 'Data Visualization',
                    'value' : 'Data Visualization',
                },
                {
                    'label' : 'SCRUM',
                    'value' : 'SCRUM'
                },
                {
                    'label' : 'UI/UX',
                    'value' : 'UI/UX'
                },
                {
                    'label' : 'Business Scaling',
                    'value' : 'Business Scaling'
                },
                {
                    'label' : 'QA Testing',
                    'value' : 'QA Testing'
                },
            ]
        }

    ]
}
module.exports = {

    generalPresets: function (res) {
        return res.contentType('json').status(200).send(starting_options);
    },
    getGeneralJSON : function(){
        return GENERAL_PRESET_TAGS;
    }
}
