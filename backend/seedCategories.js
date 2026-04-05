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
      {
        name: '5lpa',
        rows: [
          {
            title: 'Coding Problems',
            tasks: ['Minimum 150 problems (HackerRank / CodeChef / LeetCode / SkillRack)'],
          },
          {
            title: 'Open Source / GitHub',
            tasks: [
              'Hacktoberfest: 1 accepted PR',
              'Solve 1 beginner issue',
              'Join GitHub and participate in discussions',
            ],
          },
          {
            title: 'Competitions / Achievements',
            tasks: [
              'Any one of the following:',
              'National contest participation',
              'Internal hackathon Top 20%',
              'CodeVita Round 1',
              'HackWithInfy participation',
            ],
          },
          {
            title: 'Certificates',
            tasks: ['Both required:', 'NPTEL (4/8 week)', 'Any one international certificate'],
          },
          {
            title: 'CP Rating',
            tasks: ['CodeChef: 1-2 star', 'Codeforces: 800-999 (Newbie)', 'AtCoder: 0-399'],
          },
          {
            title: 'Projects / Product Development',
            tasks: [
              'Any two of the following:',
              'SIH participation',
              'Kaggle beginner notebook',
              'Internal workshop / mini project',
              'Open-source mini project (10+ stars optional)',
            ],
          },
          {
            title: 'Aptitude',
            tasks: ['Any one of the following:', 'Internal aptitude test pass'],
          },
          {
            title: 'Soft Skills',
            tasks: ['Any one of the following:', 'NPTEL Soft Skills (Pass)'],
          },
        ],
      },
      {
        name: '7lpa',
        rows: [
          {
            title: 'Coding Problems',
            tasks: ['Minimum 250 problems (100+ LeetCode)'],
          },
          {
            title: 'Open Source / GitHub',
            tasks: ['1-2 merged PRs (public repo)', 'Contributor in OSS community'],
          },
          {
            title: 'Competitions / Achievements',
            tasks: [
              'Any three of the following:',
              'CodeVita Round 2',
              'HackWithInfy shortlisted',
              'Internal hackathon Top 20%',
              'HackerEarth Circuits Top 20%',
            ],
          },
          {
            title: 'Certificates',
            tasks: [
              'Any two of the following:',
              'NPTEL Elite',
              'AWS Practitioner',
              'Azure Fundamentals',
              'Google Data Analytics',
            ],
          },
          {
            title: 'CP Rating',
            tasks: ['CodeChef: 2-3 star', 'Codeforces: 1000-1199 (Pupil)', 'AtCoder: 400-799'],
          },
          {
            title: 'Projects / Product Development',
            tasks: [
              'Any two of the following:',
              'SIH finalist (college/nodal)',
              'Kaggle Bronze (Top 40%)',
              'Devfolio hackathon Top 10',
              'College project expo Top 10',
              'Open-source project (10+ stars)',
            ],
          },
          {
            title: 'Aptitude',
            tasks: ['Any one of the following:', 'Internal test > 75%'],
          },
          {
            title: 'Soft Skills',
            tasks: ['Any one of the following:', 'NPTEL Soft Skills (Elite)', 'Career Edge'],
          },
        ],
      },
      {
        name: '10lpa',
        rows: [
          {
            title: 'Coding Problems',
            tasks: ['Minimum 400-500 problems (150+ LeetCode)'],
          },
          {
            title: 'Open Source / GitHub',
            tasks: [
              '3+ merged PRs',
              'Maintainer / Co-maintainer (100+ contributions)',
              'Completed OSS project',
              'Hacktoberfest (4 PR badge)',
            ],
          },
          {
            title: 'Competitions / Achievements',
            tasks: [
              'Any five of the following:',
              'ICPC Regional Finalist',
              'Code Gladiators Finalist',
              'Codeforces Top 20%',
              'AtCoder High Rank',
              'LeetCode Weekly Top 5%',
              'Kaggle Silver',
              'Facebook Hacker Cup Round 2',
              'CodeChef Top 10%',
            ],
          },
          {
            title: 'Certificates',
            tasks: [
              'Any three of the following:',
              'AWS Solutions Architect',
              'GCP ACE',
              'Azure Developer',
              'RHCSA',
              'TensorFlow Developer',
            ],
          },
          {
            title: 'CP Rating',
            tasks: ['CodeChef: 3+ star', 'Codeforces: 1200-1400+ (Specialist)', 'AtCoder: 800-1199'],
          },
          {
            title: 'Projects / Product Development',
            tasks: [
              'Any two of the following:',
              'SIH Winner',
              'Kaggle Silver (Top 10-20%)',
              'Devfolio National Finalist (ETHIndia/InOut)',
              'Industry Project Award',
              'GitHub repo 100+ stars',
            ],
          },
          {
            title: 'Aptitude',
            tasks: [
              'Any one of the following:',
              'Internal test > 85%',
              'HackerRank Problem Solving (Gold)',
            ],
          },
          {
            title: 'Soft Skills',
            tasks: [
              'Any one of the following:',
              'IELTS >= 6.5',
              'TOEFL >= 85',
              'Toastmasters (CC)',
            ],
          },
        ],
      },
    ]);

    console.log('Categories seeded successfully');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedCategories();
