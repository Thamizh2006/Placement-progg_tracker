import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from './models/categoryModel.js';

dotenv.config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected for Seeding'))
  .catch((err) => console.log(err));

const seedCategories = async () => {
  try {
    await Category.deleteMany();

    await Category.insertMany([
      /* ===========================
         🔵 UP TO 5 LPA
      ============================ */
      {
        name: '5lpa',
        rows: [
          {
            title: 'Coding Problems Solved',
            tasks: ['Minimum 150 problems (HackerRank/CodeChef/LeetCode/SkillRack)'],
          },
          {
            title: 'Open Source Contribution',
            tasks: ['Hacktoberfest: 1 accepted PR', 'One beginner issue solved (GitHub)'],
          },
          {
            title: 'Competition Achievement (Any Three)',
            tasks: [
              'CodeVita Round 1',
              'HackWithInfy participant',
              'GRID participant',
              'Internal hackathon Top 20%',
              'Google Cloud Arcade (Qwiklabs)',
              'GDSC Solution Challenge (Entry Round)',
            ],
          },
          {
            title: 'Certificate Requirement',
            tasks: ['NPTEL 4/8 week certificate', 'Any one International Certificate'],
          },
          {
            title: 'CP Rating',
            tasks: ['CodeChef 1*-2*', 'Codeforces Newbie (800-999)', 'AtCoder Grey (0-399)'],
          },
          {
            title: 'Project/Product Development (Any Two)',
            tasks: [
              'SIH participation',
              'Kaggle beginner notebook',
              'Internal hackathon Top 20%',
              'Open-source mini-project (10+ GitHub stars)',
              '1-2 merged PRs (public repo)',
              'GSSOC/SSOC Contributor badge',
              'Hacktoberfest Completed (4 PR badge)',
            ],
          },
          {
            title: 'Aptitude Checkpoint (Any One)',
            tasks: ['TCS NQT Cleared', 'Internal aptitude test pass'],
          },
          {
            title: 'Soft Skills Checkpoint (Any One)',
            tasks: [
              'TCS ION Career Edge',
              'NPTEL Soft Skills Pass',
              'Internal communication workshop',
            ],
          },
        ],
      },

      /* ===========================
         🟡 UP TO 7 LPA
      ============================ */
      {
        name: '7lpa',
        rows: [
          {
            title: 'Coding Problems Solved',
            tasks: ['Minimum 250 problems', '100+ LeetCode problems mandatory'],
          },
          {
            title: 'Open Source Contribution',
            tasks: ['GSSOC/SSOC registration + 1 PR', 'Joined GitHub issues/discussions'],
          },
          {
            title: 'Competition Achievement (Any Three)',
            tasks: [
              'CodeVita Round 2',
              'HackWithInfy shortlist',
              'GRID shortlist',
              'Amazon ML Summer School selected',
              'HackerEarth Circuits Top 40%',
              'CodeChef Long/Starters Top 25%',
            ],
          },
          {
            title: 'Advanced Certificate Requirement (Any Two)',
            tasks: [
              'NPTEL Elite',
              'AWS Practitioner',
              'Azure Fundamentals',
              'Google Data Analytics',
            ],
          },
          {
            title: 'CP Rating',
            tasks: [
              'CodeChef 2*-3*',
              'Codeforces 1000-1199 (Newbie->Pupil)',
              'AtCoder Grey-Brown (400-799)',
            ],
          },
          {
            title: 'Intermediate Project Achievement (Any Two)',
            tasks: [
              'SIH finalist (college/nodal)',
              'Devfolio hackathon shortlist (Top 10)',
              'Kaggle Bronze/Top 40%',
              'College project expo Top 10',
            ],
          },
          {
            title: 'Aptitude Checkpoint (Any One)',
            tasks: ['TCS NQT Cognitive > 75%', 'Internal aptitude test > 75%'],
          },
          {
            title: 'Soft Skills Checkpoint (Any One)',
            tasks: ['NPTEL Soft Skills Elite', 'Cambridge PET', 'Toastmasters Icebreaker'],
          },
        ],
      },

      /* ===========================
         🔴 ABOVE 10 LPA
      ============================ */
      {
        name: '10lpa',
        rows: [
          {
            title: 'Coding Problems Solved',
            tasks: ['400-500 problems', '150+ LeetCode problems mandatory'],
          },
          {
            title: 'Open Source Contribution',
            tasks: [
              '3+ merged PRs (public repos)',
              'GSSOC/SSOC Top Contributor/Gold Badge',
              'Maintainer/co-maintainer (100+ stars repo)',
            ],
          },

          {
            title: 'Competition Achievement (Mandatory Finalist - Any Five)',
            tasks: [
              'ICPC Regional Finalist',
              'Code Gladiators finalist',
              'Codeforces Global Rank Top 20%',
              'AtCoder Regular Contest High Rank',
              'HackerEarth Circuits Top 20%',
              'Reply Code Challenge Global ranking',
              'LeetCode Weekly Top 5%',
              'Kaggle Silver',
              'Facebook Hacker Cup Round 2',
              'CodeChef Long/Starters Top 10%',
            ],
          },

          {
            title: 'Premium International Certificates (Any Three)',
            tasks: [
              'RHCSA',
              'TensorFlow Developer',
              'AWS Solutions Architect',
              'GCP ACE',
              'Azure Certification',
            ],
          },
          {
            title: 'CP Rating',
            tasks: [
              'CodeChef 3*+',
              'Codeforces 1200-1400+ (Pupil/Specialist)',
              'AtCoder Green (800-1199)',
            ],
          },

          {
            title: 'Advanced Project Achievement (Any Two)',
            tasks: [
              'SIH Winner',
              'Kaggle Silver (Top 10-20%)',
              'Devfolio National Finalist',
              'Industry Project Excellence Award',
              'Play Store app 10K+ installs',
              'GitHub repo 100+ stars',
            ],
          },
          {
            title: 'Aptitude Checkpoint (Any One)',
            tasks: [
              'HackerRank Problem Solving Gold',
              'TCS NQT Cognitive ≥ 85%',
              'Internal aptitude test ≥ 85%',
            ],
          },
          {
            title: 'Soft Skills Checkpoint (Any One)',
            tasks: ['Cambridge B2 Vantage', 'IELTS ≥ 6.5 / TOEFL > 85', 'Toastmasters CC'],
          },
        ],
      },
    ]);

    console.log('✅ Real categories seeded successfully');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedCategories();
