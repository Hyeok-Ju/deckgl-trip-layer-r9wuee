import React, { Component } from 'react';
import { render } from 'react-dom';
import { StaticMap } from 'react-map-gl';
import { AmbientLight, PointLight, LightingEffect } from '@deck.gl/core';
import DeckGL from '@deck.gl/react';
import { PolygonLayer } from '@deck.gl/layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import { ScatterplotLayer } from '@deck.gl/layers';

// Set your mapbox token here
const MAPBOX_TOKEN = `pk.eyJ1Ijoic3BlYXI1MzA2IiwiYSI6ImNremN5Z2FrOTI0ZGgycm45Mzh3dDV6OWQifQ.kXGWHPRjnVAEHgVgLzXn2g`; // eslint-disable-line

// Source data CSV
const DATA_JSON = {
  TRIPS: require('./trips.json'),
  EMPTY: require('./empty.json'),
};

const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 1.0,
});

const pointLight = new PointLight({
  color: [255, 255, 255],
  intensity: 2.0,
  position: [-74.05, 40.7, 8000],
});

const lightingEffect = new LightingEffect({ ambientLight, pointLight });

const material = {
  ambient: 0.1,
  diffuse: 0.6,
  shininess: 32,
  specularColor: [60, 64, 70],
};

const DEFAULT_THEME = {
  buildingColor: [74, 80, 87],
  trailColor0: [253, 128, 93],
  trailColor1: [23, 184, 190],
  material,
  effects: [lightingEffect],
};

const INITIAL_VIEW_STATE = {
  longitude: 126.9779692,
  latitude: 37.566535,
  zoom: 9.5,
  pitch: 30,
  bearing: 0,
};

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      time: 1,
    };
  }

  componentDidMount() {
    this._animate();
  }

  componentWillUnmount() {
    if (this._animationFrame) {
      window.cancelAnimationFrame(this._animationFrame);
    }
  }

  _animate() {
    const {
      loopLength = 1800, // unit corresponds to the timestamp in source data
      animationSpeed = 10, // unit time per second
    } = this.props;
    const timestamp = Date.now() / 1000;
    const loopTime = loopLength / animationSpeed;

    this.setState({
      time: ((timestamp % loopTime) / loopTime) * loopLength,
    });
    // console.log(((timestamp % loopTime) / loopTime) * loopLength);
    this._animationFrame = window.requestAnimationFrame(
      this._animate.bind(this)
    );
  }

  _renderLayers() {
    const {
      trips = DATA_JSON.TRIPS,
      empty = DATA_JSON.EMPTY,
      trailLength = 10,
      theme = DEFAULT_THEME,
    } = this.props;

    const arr = [];
    if (typeof empty === 'object') {
      Object.keys(empty).map((k) => {
        var item = empty[k];
        var loc = item.path;
        if (Object.keys(item).length === 2) {
          var start = item.timestamp[0];
          var end = item.timestamp[1];
        } else {
          var start = item.timestamp[0];
          var end = item.timestamp[0];
        }

        if ((this.state.time >= start) & (this.state.time <= end)) {
          arr.push(loc);
        }
      });
    }

    return [
      new TripsLayer({
        id: 'trips',
        data: trips,
        getPath: (d) => d.path,
        getTimestamps: (d) => d.timestamps,
        getColor: (d) =>
          d.vendor === 0 ? theme.trailColor0 : theme.trailColor1,
        opacity: 0.3,
        widthMinPixels: 5,
        rounded: true,
        trailLength: trailLength,
        currentTime: this.state.time,
        shadowEnabled: false,
      }),

      new ScatterplotLayer({
        id: 'scatterplot',
        data: arr, // load data from server
        getPosition: (d) => [d[0], d[1]], // get lng,lat from each point
        getColor: (d) => [255, 255, 255],
        getRadius: (d) => 25,
        opacity: 0.9,
        pickable: false,
        radiusMinPixels: 3,
        radiusMaxPixels: 30,
      }),
    ];
  }

  render() {
    const {
      viewState,
      mapStyle = 'mapbox://styles/spear5306/ckzcz5m8w002814o2coz02sjc',
      theme = DEFAULT_THEME,
    } = this.props;

    return (
      <DeckGL
        layers={this._renderLayers()}
        effects={theme.effects}
        initialViewState={INITIAL_VIEW_STATE}
        viewState={viewState}
        controller={true}
      >
        <StaticMap
          reuseMaps
          mapStyle={mapStyle}
          preventStyleDiffing={true}
          mapboxApiAccessToken={MAPBOX_TOKEN}
        />
      </DeckGL>
    );
  }
}

export function renderToDOM(container) {
  render(<App />, container);
}
