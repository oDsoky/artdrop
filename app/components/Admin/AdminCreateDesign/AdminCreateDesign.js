import React from 'react'
import reactor from 'state/reactor'
import Store from 'state/main'
import RenderLayers from 'components/Design/RenderLayers/RenderLayers'
import RenderLayersCanvas from 'components/Design/RenderLayersCanvas/RenderLayersCanvas'
import ColorsButtonRotate from 'components/ColorsButtonRotate/ColorsButtonRotate'
import ColorPalette from 'components/ColorPalette/ColorPalette'
import Immutable from 'Immutable'
import Notification from 'components/Notification/Notification'
import {imageUrlForLayer,imageUrlForLayerImage,imageUrlForSurface} from 'state/utils'
import {rotateColorPalette} from 'state/utils'
import {designPreviewSize} from 'config'

export default React.createClass({
  mixins: [reactor.ReactMixin],

  getDataBindings() {
    return {layerImages: Store.getters.layerImages,
            colorPalettes: Store.getters.colorPalettes,
            surfaces: Store.getters.surfaces}
  },

  getInitialState() {
    return {newDesign: Immutable.fromJS({layers:[{paletteRotation:0},{paletteRotation:0},{paletteRotation:0}], adminCreated: true}),
            currentLayer: 0,
            errors: [],
            messages: [],
            width: 400,
            height: 400,
            designJpgUrl: null}
  },

  componentWillMount() {
    Store.actions.loadAdminCreateDesignData()
  },

  clearMessages() {
    this.setState({messages: []})
  },

  selectSurface(surface) {
    this.setState({newDesign: this.state.newDesign.set('surface', surface)})
  },

  selectLayerImage(layerImage) {
    var layerIndex = this.state.currentLayer
    var newDesign = this.state.newDesign.updateIn(['layers', layerIndex],
                                l => l.set('selectedLayerImage', layerImage))
    this.setState({newDesign: newDesign})
  },

  selectColorPalette(palette) {
    var layerIndex = this.state.currentLayer
    var newDesign = this.state.newDesign.updateIn(['layers', layerIndex], l => l.set('colorPalette', palette))
    this.setState({newDesign:newDesign})
  },

  handleRotateColorPalette() {
    var design = this.state.newDesign
    var layer = design.getIn(['layers', this.state.currentLayer])
    this.setState({newDesign: rotateColorPalette(design, layer, this.state.currentLayer)})
  },

  selectLayer(i) {
    this.setState({currentLayer: i})
  },

  updateTitle(e) {
    this.setState({newDesign: this.state.newDesign.set('title', e.target.value)})
  },

  saveDesign(e) {
    e.preventDefault()
    var newDesign = this.state.newDesign
    var title = newDesign.get('title')
    var surface = newDesign.get('surface')
    var errors = []
    var messages = []
    if (!title || title.length === 0) {
      errors.push('You must set a title')
    }
    if (!surface) { errors.push('You must select a surface') }
    var layersValid = (
      newDesign.get('layers')
      .every(l => l.has('colorPalette') && l.has('selectedLayerImage'))
    )
    if (!layersValid) {
      errors.push('You must select a color palette and image for every layer.')
    }

    if (errors.length === 0) {
      let svgEls = document.querySelectorAll('.canvas .layer svg')
      Store.actions.createNewDesign({design: newDesign, svgEls: svgEls})
      messages.push('Design successfully created.')
    }
    this.setState({errors: errors, messages: messages})
  },

  render() {
    var surfaces = this.state.surfaces.map(s => {
      var border = (this.state.newDesign.getIn(['surface', 'id']) === s.get('id') ? '2px solid' : 'none')
      return <img src={imageUrlForSurface(s)}
                  onClick={this.selectSurface.bind(null, s)}
                  width={40} height={40} key={s.get('id')}
                  style={{border:border}}/>
    })

    var palettes = this.state.colorPalettes.map(p => {
      var bg = (this.state.newDesign.getIn(['layers', this.state.currentLayer, 'colorPalette'])
               === p ? 'yellow' : '#fff')
     return (
       <div style={{background:bg}}>
         <ColorPalette onClick={this.selectColorPalette.bind(null, p)}
                       palette={p}/>
       </div>
       )
    })

    var layerImages = this.state.layerImages.map(layerImage => {
      var bg = (this.state.newDesign.getIn(['layers',this.state.currentLayer,
                  'selectedLayerImage']) === layerImage ? 'yellow' : '#fff')
      return (
        <li onClick={this.selectLayerImage.bind(null, layerImage)}
            style={{background:bg}}>
          <img src={imageUrlForLayerImage(layerImage)}/>
        </li>
      )
    })

    var layers = (
      this.state.newDesign.get('layers')
        .filter(l => l.has('colorPalette') &&
                     l.has('selectedLayerImage')))

    var errors = this.state.errors.map(e => {
      return <p style={{background:'#E85672'}}>{e}</p>
    })

    var messages = this.state.messages.map(m => {
      return <Notification message={m} onClose={this.clearMessages}/>
    })

    var height = this.state.height
    var width = this.state.width
    var selectLayers = [0,1,2].map(i => {
      return (
        <div style={{
          background:(this.state.currentLayer === i ? 'yellow' : '#fff'),
          border: '1px solid',
          display:'inline-block',
          padding: 10}}
          onClick={this.selectLayer.bind(null, i)}>Layer {i}</div>
        )
    })

    return (
      <div className="admin-create-design">
        {this.state.errors.length > 0 ? <div>{errors}</div> : null}
        {this.state.messages.length > 0 ? <div>{messages}</div> : null}
        <p>Design:</p>

        <div style={{height:height, width:width, position:'relative', border: '1px solid'}}>
          <RenderLayers layers={layers} width={width} height={height} />
        </div>

        <label>Select layer to edit</label>
        <div style={{padding:20}}>
          {selectLayers}
        </div>

        <form onSubmit={this.saveDesign}>
          <label>Title</label>
          <input type="text" value={this.state.newDesign.get('title')} onChange={this.updateTitle}></input>
          <input type="submit"></input>
        </form>

        <section className='choose-palette'>
          {this.state.newDesign.getIn(['layers', this.state.currentLayer, 'colorPalette']) ?
            <ColorsButtonRotate layer={this.state.newDesign.getIn(['layers', this.state.currentLayer])}
              onClick={this.handleRotateColorPalette}/>
            : null
          }
          {palettes}
        </section>

        <ul className="select-layer-image">
          {layerImages}
        </ul>

        {surfaces}

      </div>
    )
  }
})