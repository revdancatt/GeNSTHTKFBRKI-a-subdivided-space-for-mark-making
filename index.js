/* global preloadImagesTmr $fx fxhash Line fxrand paper1Loaded page PAPER */
// We may use: noise fxpreview
//
//  fxhash - GeNSTHTKFBRKI
//
//
//  HELLO!! Code is copyright revdancatt (that's me), so no sneaky using it for your
//  NFT projects.
//  But please feel free to unpick it, and ask me questions. A quick note, this is written
//  as an artist, which is a slightly different (and more storytelling way) of writing
//  code, than if this was an engineering project. I've tried to keep it somewhat readable
//  rather than doing clever shortcuts, that are cool, but harder for people to understand.
//
//  You can find me at...
//  https://twitter.com/revdancatt
//  https://instagram.com/revdancatt
//  https://youtube.com/revdancatt
//

const ratio = 420 / 297
// const startTime = new Date().getTime() // so we can figure out how long since the scene started
let drawn = false
let highRes = false // display high or low res
let drawPaper = true
const features = {}
const nextFrame = null
let resizeTmr = null
// let thumbnailTaken = false
const dumpOutputs = false

window.$fxhashFeatures = {}

const debugPalettes = [
  '#000000',
  '#bb00bb',
  '#00bbbb',
  '#bbbb00',
  '#bb0000',
  '#00bb00',
  '#0000bb'
]

$fx.params([
  {
    id: 'subdivisions',
    name: 'Subdivisions',
    type: 'number',
    default: 7,
    options: {
      min: 4,
      max: 60,
      step: 1
    }
  }, {
    id: 'vertLines',
    name: 'Vertical Lines',
    type: 'number',
    default: 376,
    options: {
      min: 39,
      max: 1980,
      step: 1
    }
  }, {
    id: 'marginSides',
    name: 'Side Margin',
    type: 'number',
    default: 10,
    options: {
      min: 10,
      max: 143,
      step: 1
    }
  }, {
    id: 'marginTopBottom',
    name: 'Top/Bottom Margin',
    type: 'number',
    default: 10,
    options: {
      min: 10,
      max: 193,
      step: 1
    }
  }, {
    id: 'markMakers',
    name: 'Mark Makers',
    type: 'number',
    default: 3,
    options: {
      min: 1,
      max: 7,
      step: 1
    }
  }, {
    id: 'previewMarkers',
    name: 'Preview Markers',
    type: 'boolean',
    default: false
  }, {
    id: 'driftChance',
    name: 'Chance of Drift',
    type: 'number',
    default: 0,
    options: {
      min: 0,
      max: 100,
      step: 1
    }
  }, {
    id: 'horizontalDrift',
    name: 'Horizontal Drift',
    type: 'number',
    default: 0,
    options: {
      min: 0,
      max: 143,
      step: 1
    }
  }, {
    id: 'verticalDrift',
    name: 'Vertical Drift',
    type: 'number',
    default: 0,
    options: {
      min: 0,
      max: 193,
      step: 1
    }
  }, {
    id: 'skewChance',
    name: 'Chance of Skew',
    type: 'number',
    default: 0,
    options: {
      min: 0,
      max: 100,
      step: 1
    }
  }, {
    id: 'skewAmount',
    name: 'Skew Amount',
    type: 'number',
    default: 5,
    options: {
      min: 0,
      max: 10,
      step: 1
    }
  }
])

//  Work out what all our features are
const makeFeatures = () => {
  // features.background = 1
  features.paperOffset = {
    paper1: {
      x: fxrand(),
      y: fxrand()
    },
    paper2: {
      x: fxrand(),
      y: fxrand()
    }
  }

  // We are going to pretend the page is 297mm wide, and then work out the height
  // we are going to do work out everything in mm, and then convert to pixels for display later
  features.pageSize = {
    w: 297
  }
  features.pageSize.h = Math.floor(features.pageSize.w * ratio)

  // Create the human readable features object
  const featuresObject = {}

  // Now we are going to create the segments, the first one is going to the pageSize then taking into account the margins
  const segments = []
  const thisSegment = {
    left: $fx.getParam('marginSides'),
    right: features.pageSize.w - $fx.getParam('marginSides'),
    top: $fx.getParam('marginTopBottom'),
    bottom: features.pageSize.h - $fx.getParam('marginTopBottom')
  }
  thisSegment.width = thisSegment.right - thisSegment.left
  thisSegment.height = thisSegment.bottom - thisSegment.top
  segments.push(thisSegment)
  // Now while the number of segments is less than the number of subdivisions we want, we'll keep splitting them
  while (segments.length < $fx.getParam('subdivisions')) {
    // Randomly pick a segment to split
    const segmentToSplit = Math.floor(fxrand() * segments.length)
    let horizontalSplitChance = 0.66
    // Work out if the segment is wider than it is tall, if set the horizontal split chance to 0.333
    if (segments[segmentToSplit].width > segments[segmentToSplit].height) horizontalSplitChance = 0.333
    // Decide if we are going to split it horizontally or vertically
    if (fxrand() < horizontalSplitChance) {
      // Split it horizontally, anywhere from 15% to 85% of the way down
      const splitPoint = segments[segmentToSplit].top + (segments[segmentToSplit].height * (0.15 + (fxrand() * 0.7)))
      // Now create two new segments
      const newSegment1 = {
        left: segments[segmentToSplit].left,
        right: segments[segmentToSplit].right,
        top: segments[segmentToSplit].top,
        bottom: splitPoint
      }
      newSegment1.width = newSegment1.right - newSegment1.left
      newSegment1.height = newSegment1.bottom - newSegment1.top
      const newSegment2 = {
        left: segments[segmentToSplit].left,
        right: segments[segmentToSplit].right,
        top: splitPoint,
        bottom: segments[segmentToSplit].bottom
      }
      newSegment2.width = newSegment2.right - newSegment2.left
      newSegment2.height = newSegment2.bottom - newSegment2.top
      // remove the old segment
      segments.splice(segmentToSplit, 1, newSegment1, newSegment2)
    } else {
      // Split it vertically, anywhere from 15% to 85% of the way across
      const splitPoint = segments[segmentToSplit].left + (segments[segmentToSplit].width * (0.15 + (fxrand() * 0.7)))
      // Now create two new segments
      const newSegment1 = {
        left: segments[segmentToSplit].left,
        right: splitPoint,
        top: segments[segmentToSplit].top,
        bottom: segments[segmentToSplit].bottom
      }
      newSegment1.width = newSegment1.right - newSegment1.left
      newSegment1.height = newSegment1.bottom - newSegment1.top
      const newSegment2 = {
        left: splitPoint,
        right: segments[segmentToSplit].right,
        top: segments[segmentToSplit].top,
        bottom: segments[segmentToSplit].bottom
      }
      newSegment2.width = newSegment2.right - newSegment2.left
      newSegment2.height = newSegment2.bottom - newSegment2.top
      // remove the old segment
      segments.splice(segmentToSplit, 1, newSegment1, newSegment2)
    }
  }
  // Assign a mark maker to each segment
  for (let i = 0; i < segments.length; i++) {
    segments[i].markMaker = Math.floor(fxrand() * $fx.getParam('markMakers'))
  }
  // Now we need to go through each segment and work out if it's drifting or not
  for (let i = 0; i < segments.length; i++) {
    // Check the chance of it drifting
    if (fxrand() * 100 < $fx.getParam('driftChance')) {
      // Pick the horizontal drift amount which is random between 0 and the drift amount
      const horizontalDrift = fxrand() * $fx.getParam('horizontalDrift')
      // Now subtract the drift amount from the left and add it to the right and bottom
      segments[i].left -= horizontalDrift
      segments[i].right += horizontalDrift
      // Now we need to check if the segment is now outside the margin, and if so, move it back
      if (segments[i].left < $fx.getParam('marginSides')) segments[i].left = $fx.getParam('marginSides')
      if (segments[i].right > features.pageSize.w - $fx.getParam('marginSides')) segments[i].right = features.pageSize.w - $fx.getParam('marginSides')
    }
  }
  // Same again for the vertical drift
  for (let i = 0; i < segments.length; i++) {
    if (fxrand() * 100 < $fx.getParam('driftChance')) {
      const verticalDrift = fxrand() * $fx.getParam('verticalDrift')
      segments[i].top -= verticalDrift
      segments[i].bottom += verticalDrift
      if (segments[i].top < $fx.getParam('marginTopBottom')) segments[i].top = $fx.getParam('marginTopBottom')
      if (segments[i].bottom > features.pageSize.h - $fx.getParam('marginTopBottom')) segments[i].bottom = features.pageSize.h - $fx.getParam('marginTopBottom')
    }
  }

  // We know how many lines we are _in theory_ fitting down the whole page, so now we can caculate the step size
  const stepSize = features.pageSize.h / $fx.getParam('vertLines')
  // Now we want to create the lines on each segment
  for (let i = 0; i < segments.length; i++) {
    // As we are going to add the lines down, we only really care about a y position, so let's
    // set y to the top of the segment, and then use a while loop that will add the step size
    // to y until we get to the bottom of the segment. First add a lines array to the segment
    segments[i].lines = []
    let y = segments[i].top
    while (y < segments[i].bottom) {
      // Now create a line object
      const line = []
      // Add the first point
      line.push({
        x: segments[i].left,
        y
      })
      // Now add the second point
      line.push({
        x: segments[i].right,
        y
      })
      // Now add the line to the segment
      segments[i].lines.push(line)
      // Now add the step size to y
      y += stepSize
    }
  }

  // Now we may need to skew the lines
  for (let i = 0; i < segments.length; i++) {
    // Check the chance of it skewing
    if (fxrand() * 100 < $fx.getParam('skewChance')) {
      // Work out the random skew amount
      const skewAmount = fxrand() * $fx.getParam('skewAmount')
      const skewLeftDown = fxrand() < 0.5
      // Now loop through the lines, and skew them
      for (let j = 0; j < segments[i].lines.length; j++) {
        // Work out the length of the line
        const lineLength = segments[i].lines[j][1].x - segments[i].lines[j][0].x
        // The new skew amount is the skew amount multiplied by the line length
        const finalSkewAmount = skewAmount * lineLength * 0.01
        if (skewLeftDown) {
          // Work out the new x position for the first point
          segments[i].lines[j][0].y += finalSkewAmount
          // Work out the new x position for the second point
          segments[i].lines[j][1].y -= finalSkewAmount
        } else {
          // Work out the new x position for the first point
          segments[i].lines[j][0].y -= finalSkewAmount
          // Work out the new x position for the second point
          segments[i].lines[j][1].y += finalSkewAmount
        }
      }
    }
  }

  features.segments = segments
  console.log(features)

  featuresObject.Subdivisions = $fx.getParam('subdivisions')
  featuresObject['Vertical lines'] = $fx.getParam('vertLines')
  $fx.features(featuresObject)
}

//  Call the above make features, so we'll have the window.$fxhashFeatures available
//  for fxhash
makeFeatures()

const init = async () => {
  //  I should add a timer to this, but really how often to people who aren't
  //  the developer resize stuff all the time. Stick it in a digital frame and
  //  have done with it!
  window.addEventListener('resize', async () => {
    //  If we do resize though, work out the new size...
    clearTimeout(resizeTmr)
    resizeTmr = setTimeout(async () => {
      await layoutCanvas()
    }, 100)
  })

  //  Now layout the canvas
  await layoutCanvas()
}

const layoutCanvas = async () => {
  //  Kill the next animation frame
  window.cancelAnimationFrame(nextFrame)

  const wWidth = window.innerWidth
  const wHeight = window.innerHeight
  let cWidth = wWidth
  let cHeight = cWidth * ratio
  if (cHeight > wHeight) {
    cHeight = wHeight
    cWidth = wHeight / ratio
  }
  const canvas = document.getElementById('target')
  if (highRes) {
    canvas.height = 8192
    canvas.width = 8192 / ratio
  } else {
    canvas.width = Math.min((8192 / 2), cWidth * 2)
    canvas.height = Math.min((8192 * ratio / 2), cHeight * 2)
    //  Minimum size to be half of the high rez cersion
    if (Math.min(canvas.width, canvas.height) < 8192 / 2) {
      if (canvas.width < canvas.height) {
        canvas.height = 8192 / 2
        canvas.width = 8192 / 2 / ratio
      } else {
        canvas.width = 8192 / 2
        canvas.height = 8192 / 2 / ratio
      }
    }
  }

  canvas.style.position = 'absolute'
  canvas.style.width = `${cWidth}px`
  canvas.style.height = `${cHeight}px`
  canvas.style.left = `${(wWidth - cWidth) / 2}px`
  canvas.style.top = `${(wHeight - cHeight) / 2}px`

  //  Re-Create the paper pattern
  const paper1 = document.createElement('canvas')
  paper1.width = canvas.width / 2
  paper1.height = canvas.height / 2
  const paper1Ctx = paper1.getContext('2d')
  await paper1Ctx.drawImage(paper1Loaded, 0, 0, 1920, 1920, 0, 0, paper1.width, paper1.height)
  features.paper1Pattern = paper1Ctx.createPattern(paper1, 'repeat')

  const paper2 = document.createElement('canvas')
  paper2.width = canvas.width / (22 / 7)
  paper2.height = canvas.height / (22 / 7)
  const paper2Ctx = paper2.getContext('2d')
  await paper2Ctx.drawImage(paper1Loaded, 0, 0, 1920, 1920, 0, 0, paper2.width, paper2.height)
  features.paper2Pattern = paper2Ctx.createPattern(paper2, 'repeat')

  //  And draw it!!
  drawCanvas()
}

const drawCanvas = async () => {
  //  Let the preloader know that we've hit this function at least once
  drawn = true
  //  Make sure there's only one nextFrame to be called
  window.cancelAnimationFrame(nextFrame)

  // Grab all the canvas stuff
  const canvas = document.getElementById('target')
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height

  //  Lay down the paper texture
  if (drawPaper) {
    ctx.fillStyle = features.paper1Pattern
    ctx.save()
    ctx.translate(-w * features.paperOffset.paper1.x, -h * features.paperOffset.paper1.y)
    ctx.fillRect(0, 0, w * 2, h * 2)
    ctx.restore()
  } else {
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, w, h)
  }

  // We need to set the default line width, which will be the canvas height divided my the pageSize height times two
  // This is to represent roughly a line width of 0.5mm on an A3 page
  ctx.lineWidth = h / features.pageSize.h / 2
  // Now loop through the segments and draw the bounding boxes
  features.segments.forEach(segment => {
    // Set the stroke colour
    ctx.strokeStyle = 'black'
    // If we are previewing the mark maker, then set the stroke colour to the mark maker colour
    if ($fx.getParam('previewMarkers')) ctx.strokeStyle = debugPalettes[segment.markMaker]
    // Loop through the lines
    segment.lines.forEach(points => {
      // Draw the line
      ctx.beginPath()
      // Move to the first point
      ctx.moveTo(points[0].x / features.pageSize.w * w, points[0].y / features.pageSize.h * h)
      // Now loop through the rest of the points
      for (let i = 1; i < points.length; i++) {
        // Draw the line
        ctx.lineTo(points[i].x / features.pageSize.w * w, points[i].y / features.pageSize.h * h)
      }
      ctx.stroke()
    })
  })
}

const downloadSVG = async size => {
  const allLines = []
  // We want to create an SVG for each mark maker, so loop through the mark makers
  for (let i = 0; i < $fx.getParam('markMakers'); i++) {
    const lines = []
    // Loop through the segments and add the lines to the lines array if they match the mark maker
    features.segments.forEach(segment => {
      if (segment.markMaker === i) {
        // Now loop through the lines
        segment.lines.forEach(points => {
          const newLine = new Line()
          // Loop through the points
          points.forEach(point => {
            newLine.addPoint(point.x / features.pageSize.w * PAPER[size][0], point.y / features.pageSize.h * PAPER[size][1])
          })
          lines.push(newLine)
        })
      }
    })
    allLines.push(lines)
  }
  // Now loop through the allLines
  let layerCount = 0
  for (const lines of allLines) {
    await page.wrapSVG(lines, PAPER[size], `GeNSTHTKFBRKI_${size}_${fxhash}_${layerCount}`, 1)
    layerCount++
  }
  /*
  for (const svgLayer of svgLayers) {
    // Create a new array to hold the lines for this svgLayer
    const svgLines = []
    // Loop through the finalLines array and add the lines to the svgLines array if they match the svgLayer
    finalLines.forEach(line => {
      if (line.svgLayer === svgLayer) svgLines.push(line)
    })
    await page.wrapSVG(svgLines, PAPER[size], `GeNSTHTKFBRKI_${size}_${fxhash}_${svgLayer}`, 1)
  }
  */
}

const autoDownloadCanvas = async (showHash = false) => {
  const element = document.createElement('a')
  element.setAttribute('download', `GeNSTHTKFBRKI_${fxhash}`)
  element.style.display = 'none'
  document.body.appendChild(element)
  let imageBlob = null
  imageBlob = await new Promise(resolve => document.getElementById('target').toBlob(resolve, 'image/png'))
  element.setAttribute('href', window.URL.createObjectURL(imageBlob, {
    type: 'image/png'
  }))
  element.click()
  document.body.removeChild(element)
  // If we are dumping outputs then reload the page
  if (dumpOutputs) {
    window.location.reload()
  }
}

//  KEY PRESSED OF DOOM
document.addEventListener('keypress', async (e) => {
  e = e || window.event
  // Save
  if (e.key === 's') autoDownloadCanvas()

  //   Toggle highres mode
  if (e.key === 'h') {
    highRes = !highRes
    console.log('Highres mode is now', highRes)
    await layoutCanvas()
  }

  // Toggle the paper texture
  if (e.key === 't') {
    drawPaper = !drawPaper
    await layoutCanvas()
  }

  if (e.key === '1') downloadSVG('A1')
  if (e.key === '2') downloadSVG('A2')
  if (e.key === '3') downloadSVG('A3')
  if (e.key === '4') downloadSVG('A4')
  if (e.key === '5') downloadSVG('A5')
  if (e.key === '6') downloadSVG('A6')
})
//  This preloads the images so we can get access to them
// eslint-disable-next-line no-unused-vars
const preloadImages = () => {
  //  If paper1 has loaded and we haven't draw anything yet, then kick it all off
  if (paper1Loaded !== null && !drawn) {
    clearInterval(preloadImagesTmr)
    init()
  }
}
