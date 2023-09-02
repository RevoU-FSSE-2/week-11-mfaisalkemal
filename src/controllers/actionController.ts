import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../models/database';
import { ObjectId } from 'mongodb';
import { plainToClass } from 'class-transformer';
import Token from '../models/tokenModels';

const secretKey = process.env.SECRET_KEY_JWT || '';

export const getMembersBloodType = async (req: Request, res: Response) => {
    try {

        const bloodType = req.body.bloodtype;

        const token = req.headers.authorization + " ";
        const tokenSliced = token?.slice(7, -1);

        if (!tokenSliced) {
            return res.status(401).json({ error: 'Authorization token not provided.' });
        }

        jwt.verify(tokenSliced, secretKey, async (err, decoded) => {
            if (err) {
                return res.status(401).json({ error: 'Invalid token.' });
            }

            const loadedToken = plainToClass (Token, decoded);

            if (loadedToken.role !== 'admin' && loadedToken.role !== 'member') {
                return res.status(403).json({ error: 'Permission denied. Only admin and member can access.' });
            }

            const query = { bloodtype: bloodType, username: { $ne: loadedToken.username } };

            const db = getDb();

            const members = await db.collection('members').find( query, { projection: { _id: 0, username: 1, postalcode: 1, bloodtype: 1 }  } ).toArray();
            
            const apiKey = process.env.BING_MAPS_KEY;

            const origin = loadedToken.postalcode;
            const destinations = members.map(member => member.postalcode);

            destinations.push(origin);
            
            async function fetchCoordinates(postalCode: string) {
              const locationURL = `https://dev.virtualearth.net/REST/v1/Locations?query=${postalCode}%20Indonesia&key=${apiKey}`;
              const response = await fetch(locationURL);
              const data = await response.json();
              return data;
            }
            
            async function fetchAllCoordinates() {
              const promises = destinations.map(postalCode => fetchCoordinates(postalCode));
              const results = await Promise.all(promises);
              return results;
            }
            
            async function getCoordinatesArray() {
              const results = await fetchAllCoordinates();
              const coordinatesArray = results.map(result => {
                const coordinates = result.resourceSets[0]?.resources[0]?.point?.coordinates || null;
                const [latitude, longitude] = coordinates || [null, null];
                return { latitude, longitude };
              });
              return coordinatesArray;
            }
            
            getCoordinatesArray()
              .then(coordinatesArray => {
                const originCoordinate = coordinatesArray[coordinatesArray.length-1];
                coordinatesArray.pop();

                async function getDistanceMatrix(latitudeA: string, longitudeA: string, latitudeB: string, longitudeB: string) {
                    const distanceMatrixURL = `https://dev.virtualearth.net/REST/v1/Routes/DistanceMatrix?origins=${latitudeA},${longitudeA}&destinations=${latitudeB},${longitudeB}&travelMode=driving&avoid=tolls,highways&key=${apiKey}`;
                    const response = await fetch(distanceMatrixURL);
                    const data = await response.json();
                    return data;
                  }
                  
                  async function getDistancesFromOrigins() {
                    const origin = originCoordinate;
                    const promises = coordinatesArray.map(async destination => {
                        const data = await getDistanceMatrix(origin.latitude, origin.longitude, destination.latitude, destination.longitude);
                        const travelDistance = data.resourceSets[0]?.resources[0]?.results[0]?.travelDistance || null;
                        return { travelDistance };
                    });
                  
                    const distances = await Promise.all(promises);
                    return distances;
                  }
                  
                  getDistancesFromOrigins()
                    .then(distances => {
                        members.forEach((member, index) => {
                            member.travelDistance = distances[index].travelDistance;
                        }),
                        members.sort((a, b) => a.travelDistance - b.travelDistance);

                        const membersSort = members.map(member => ({
                            ...member,
                            travelDistance: `${member.travelDistance.toFixed(3)} km`
                          }));
                        
                        res.status(200).json({ membersSort });
                    })
                    
                
              })
              .catch(error => {
                console.error(error);
              });
              
        });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching members.' });
    }
};

export const getAllMember = async (req: Request, res: Response) => {
    try {

        const token = req.headers.authorization + " ";
        const tokenSliced = token?.slice(7, -1);

        if (!tokenSliced) {
            return res.status(401).json({ error: 'Authorization token not provided.' });
        }

        jwt.verify(tokenSliced, secretKey, async (err, decoded) => {
            if (err) {
                return res.status(401).json({ error: 'Invalid token.' });
            }

            const loadedToken = plainToClass (Token, decoded);

            if (loadedToken.role !== 'admin') {
                return res.status(403).json({ error: 'Permission denied. Only admin can access.' });
            }

            const db = getDb();

            const members = await db.collection('members').find( {} ).toArray();

            res.status(200).json({ members });
        }); 
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching members.' });
    }
};

export const patchMember = async (req: Request, res: Response) => {
    try {

        const usernameToFind = req.params.username;
        console.log(usernameToFind);
        const newRole = req.body.role;

        const token = req.headers.authorization + " ";
        const tokenSliced = token?.slice(7, -1);

        if (!tokenSliced) {
            return res.status(401).json({ error: 'Authorization token not provided.' });
        }

        jwt.verify(tokenSliced, secretKey, async (err, decoded) => {
            if (err) {
                return res.status(401).json({ error: 'Invalid token.' });
            }

            const loadedToken = plainToClass (Token, decoded);

            if (loadedToken.role !== 'admin') {
                return res.status(403).json({ error: 'Permission denied. Only admin can access.' });
            }

            const db = getDb();

            const result = await db.collection('members').updateOne(
                { username: usernameToFind },
                { $set: { role: newRole } }
              );
              
              if (result.modifiedCount === 1) {
                res.status(200).json({ message: `Role for ${usernameToFind} has been updated to ${newRole}.` });
              } else {
                res.status(404).json({ message: `${usernameToFind} not found.` });
              }            
        }); 
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching members.' });
    }
};

export const deleteMember = async (req: Request, res: Response) => {
    try {

        const token = req.headers.authorization + " ";
        const tokenSliced = token?.slice(7, -1);

        const usernameDelete = req.params.username;

        if (!tokenSliced) {
            return res.status(401).json({ error: 'Authorization token not provided.' });
        }

        jwt.verify(tokenSliced, secretKey, async (err, decoded) => {
            if (err) {
                return res.status(401).json({ error: 'Invalid token.' });
            }

            const loadedToken = plainToClass (Token, decoded);

            if (loadedToken.role !== 'admin') {
                return res.status(403).json({ error: 'Permission denied. Only admin can access.' });
            }

            const db = getDb();

            const result = await db.collection('members').deleteOne({ username: (usernameDelete) });

            if (result.deletedCount === 1) {
                res.status(200).json({ message: `username ${usernameDelete} has been deleted.` });
              } else {
                res.status(404).json({ message: `username ${usernameDelete} not found.` });
            }

        }); 
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching members.' });
    }
};