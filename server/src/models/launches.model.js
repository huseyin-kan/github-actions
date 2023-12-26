const axios = require('axios');
const launchesDatabase = require('./launches.mongo')
const planets = require('./planets.mongo')

const DEFAULT_FLIGHT_NUMBER = 100

const SPACEX_API_URL = 'https://api.spacexdata.com/v5/launches/query'

async function populateLaunches() {
    console.log('Downloading launch data...');
    const response = await axios.post(SPACEX_API_URL, {
      query: {},
      options: {
        pagination: false,
        populate: [
          {
            path: 'rocket',
            select: {
              name: 1
            }
          },
          {
            path: 'payloads',
            select: {
              'customers': 1
            }
          }
        ]
      }
    });
  
    if (response.status !== 200) {
      console.log('Problem downloading launch data');
      throw new Error('Launch data download failed');
    }
  
    const launchDocs = response.data.docs;
    for (const launchDoc of launchDocs) {
      const payloads = launchDoc['payloads'];
      const customers = payloads.flatMap((payload) => {
        return payload['customers'];
      });
  
      const launch = {
        flightNumber: launchDoc['flight_number'],
        mission: launchDoc['name'],
        rocket: launchDoc['rocket']['name'],
        launchDate: launchDoc['date_local'],
        upcoming: launchDoc['upcoming'],
        success: launchDoc['success'],
        customers,
      };
  
      console.log(`${launch.flightNumber} ${launch.mission}`);
  
      await saveLaunch(launch);
    }
  }

async function loadLaunchData(){
    const firstLaunch = await findLaunch({
        flightNumber:1,
        rocket:'Falcon 1',
        mission:'FalconSat'
    })
    if(firstLaunch){
        console.log('LAunch data already loaded');
    }else{
        await populateLaunches()
    }
    
}

async function findLaunch(filter){
    return await launchesDatabase.findOne(filter)
}

async function existsLaunchWithId(launchId){
    return await findLaunch({
        flightNumber:launchId
    })
}

async function getLatestFlightNumber(){
    const latestLunch = await launchesDatabase.findOne().sort('-flightNumber')

    if(!latestLunch) return DEFAULT_FLIGHT_NUMBER

    return latestLunch.flightNumber
}

async function getAllLaunches(skip,limit){
    return await launchesDatabase
    .find({},{'_id':0,'__v':0})
    .sort({flightNumber: 1})
    .skip(skip)
    .limit(limit)
}

async function saveLaunch(launch){
    await launchesDatabase.findOneAndUpdate({
        flightNumber:launch.flightNumber
    }, launch, {
        upsert: true
    })
}

async function scheduleNewLaunch(launch){
    const planet  = await planets.findOne({keplerName:launch.target}) 
    if(!planet){
        throw new Error('Planet name doesnt exist ')
    }

    const newFlightNumber = await getLatestFlightNumber() + 1
    
    const newLaunch = Object.assign(launch,{
        success:true,
        upcoming:true,
        customers: ['ZTM', 'NASA'],
        flightNumber:newFlightNumber
    })

    
    await saveLaunch(newLaunch)
}

async function abortLaunchById(launchId){
    const aborted = await launchesDatabase.updateOne({
        flightNumber:launchId,
    },{
        success:false,
        upcoming:false,
    })

    return aborted.modifiedCount === 1
}


module.exports ={
    loadLaunchData,
    existsLaunchWithId,
    getAllLaunches,
    scheduleNewLaunch,
    abortLaunchById,
}