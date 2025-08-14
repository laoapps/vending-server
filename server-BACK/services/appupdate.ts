import path from 'path';
import express, { Request, Response } from 'express';
import multer from 'multer';
import { Sequelize, Model, DataTypes } from 'sequelize';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { BundleEntity } from '../entities';

// Extend Express Request interface to include Multer file
interface MulterRequest extends Request {
    file?: Express.Multer.File;
}

// Configure upload directory
const bundlesDir = path.join(__dirname, 'bundles');

// Ensure bundles directory exists
async function ensureBundlesDir() {
    try {
        await fs.mkdir(bundlesDir, { recursive: true });
    } catch (error) {
        console.error('Error creating bundles directory:', error);
    }
}
ensureBundlesDir();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: bundlesDir,
    filename: (req, file, cb) => {
        const uniqueId = uuidv4();
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueId}${ext}`);
    }
});
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/zip') {
            cb(null, true);
        } else {
            cb(new Error('Only zip files are allowed'));
        }
    },
    limits: { fileSize: 200 * 1024 * 1024 }
});

// Sequelize model definition

export function initBundle(app: express.Application) {
    // Serve static bundle files
    console.log('Serving static files from:', bundlesDir);

    app.use('/bundles', express.static(bundlesDir));


    app.get('/', (req: Request, res: Response) => {
        res.send('Hello from app update service');
    });
    // Upload new bundle
    app.post('/upload-bundle', upload.single('bundle'), async (req: MulterRequest, res: Response) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }
            console.log('File uploaded:', req.file);
            // console.log('File path:', req.file.path);
            // console.log('File name:', req.file.filename);


            const { bundleId, channel = 'production' } = req.body;

            if (!bundleId) {
                await fs.unlink(path.join(bundlesDir, req.file.filename));
                return res.status(400).json({ error: 'bundleId is required' });
            }

            // Save to database

            const bundle = await BundleEntity.create({
                bundleId,
                filePath: req.file.filename,
                channel,
                name: req.file.originalname
            });

            res.json({
                message: 'Bundle uploaded successfully',
                bundle: {
                    id: bundle.id,
                    bundleId: bundle.bundleId,
                    filePath: bundle.filePath,
                    channel: bundle.channel
                }
            });
        } catch (error) {
            console.error('Upload error:', error);
            if (req.file) {
                await fs.unlink(path.join(bundlesDir, req.file.filename));
            }
            res.status(500).json({ error: 'Failed to upload bundle' });
        }
    });

    // Get latest bundle
    app.get('/latest-bundle', async (req: Request, res: Response) => {
        try {
            const { bundleId } = req.query;

            const bundle = await BundleEntity.findOne({
                where: { bundleId: bundleId + '' },
                order: [['createdAt', 'DESC']]
            });

            if (!bundle) {
                return res.status(404).json({ error: 'No bundle found' });
            }

            const serverUrl = `https://${req.get('host')}/bundles`;
            res.json({
                bundleId: bundle.bundleId,
                url: `${serverUrl}/${bundle.filePath}`,
                channel: bundle.channel
            });
        } catch (error) {
            console.error('Error fetching latest bundle:', error);
            res.status(500).json({ error: 'Failed to fetch latest bundle' });
        }
    });
}